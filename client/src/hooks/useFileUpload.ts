import { useState, useCallback } from "react";

interface UploadResult {
  success: boolean;
  key: string;
  url: string;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: UploadResult | null;
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setState({ uploading: true, progress: 0, error: null, result: null });

    try {
      // Read file as base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      setState(s => ({ ...s, progress: 50 }));

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          data: base64,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const result = await response.json() as UploadResult;
      setState({ uploading: false, progress: 100, error: null, result });
      return result;
    } catch (err: any) {
      setState({ uploading: false, progress: 0, error: err.message, result: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null, result: null });
  }, []);

  return { ...state, upload, reset };
}
