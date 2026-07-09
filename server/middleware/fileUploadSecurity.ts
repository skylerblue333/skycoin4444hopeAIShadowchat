import crypto from "crypto";
import { TRPCError } from "@trpc/server";

/**
 * File Upload Security Utilities
 * Handles file validation, scanning, and secure storage
 */

export interface FileValidationOptions {
  maxSize?: number; // bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  scanForMalware?: boolean;
}

export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  uploadedAt: Date;
  uploadedBy: string;
  scanned: boolean;
  malwareScanResult?: "CLEAN" | "INFECTED" | "UNKNOWN";
}

// Default configuration
const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const DEFAULT_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
  "txt",
  "doc",
  "docx",
];

// Dangerous file extensions to block
const DANGEROUS_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "com",
  "pif",
  "scr",
  "vbs",
  "js",
  "jar",
  "zip",
  "rar",
  "7z",
  "sh",
  "bash",
  "ps1",
  "app",
  "dmg",
  "deb",
  "rpm",
];

// Dangerous MIME types
const DANGEROUS_MIME_TYPES = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-elf",
  "application/x-sh",
  "application/x-bash",
];

/**
 * Validate file extension
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions?: string[]
): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (!ext) return false;

  // Check against dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Check against allowed extensions if specified
  if (allowedExtensions && !allowedExtensions.includes(ext)) {
    return false;
  }

  return true;
}

/**
 * Validate MIME type
 */
export function validateMimeType(
  mimeType: string,
  allowedMimeTypes?: string[]
): boolean {
  // Check against dangerous MIME types
  if (DANGEROUS_MIME_TYPES.includes(mimeType)) {
    return false;
  }

  // Check against allowed MIME types if specified
  if (allowedMimeTypes && !allowedMimeTypes.includes(mimeType)) {
    return false;
  }

  return true;
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number, maxSize?: number): boolean {
  const limit = maxSize || DEFAULT_MAX_FILE_SIZE;
  return fileSize > 0 && fileSize <= limit;
}

/**
 * Calculate file hash (SHA-256)
 */
export function calculateFileHash(fileBuffer: Buffer): string {
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

/**
 * Generate safe filename
 */
export function generateSafeFilename(originalName: string, userId: string): string {
  // Remove path traversal attempts
  const filename = originalName.replace(/\.\.\//g, "").split("/").pop() || "file";

  // Get extension
  const ext = filename.split(".").pop() || "";

  // Generate unique filename
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

  return `${userId}_${timestamp}_${random}_${sanitized}`;
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  filename: string,
  mimeType: string,
  fileSize: number,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  // Validate extension
  if (!validateFileExtension(filename, options.allowedExtensions)) {
    return {
      valid: false,
      error: `File extension not allowed. Allowed: ${(options.allowedExtensions || DEFAULT_ALLOWED_EXTENSIONS).join(", ")}`,
    };
  }

  // Validate MIME type
  if (!validateMimeType(mimeType, options.allowedMimeTypes)) {
    return {
      valid: false,
      error: `MIME type not allowed. Allowed: ${(options.allowedMimeTypes || DEFAULT_ALLOWED_MIME_TYPES).join(", ")}`,
    };
  }

  // Validate file size
  if (!validateFileSize(fileSize, options.maxSize)) {
    const maxSize = options.maxSize || DEFAULT_MAX_FILE_SIZE;
    return {
      valid: false,
      error: `File size exceeds limit. Max: ${maxSize / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Detect file type from buffer (magic bytes)
 */
export function detectFileType(
  buffer: Buffer
): { mimeType: string; extension: string } | null {
  // Check magic bytes for common file types
  const signatures: Array<{
    bytes: number[];
    mimeType: string;
    extension: string;
  }> = [
    // JPEG
    { bytes: [0xff, 0xd8, 0xff], mimeType: "image/jpeg", extension: "jpg" },
    // PNG
    { bytes: [0x89, 0x50, 0x4e, 0x47], mimeType: "image/png", extension: "png" },
    // GIF
    { bytes: [0x47, 0x49, 0x46], mimeType: "image/gif", extension: "gif" },
    // PDF
    { bytes: [0x25, 0x50, 0x44, 0x46], mimeType: "application/pdf", extension: "pdf" },
    // ZIP
    { bytes: [0x50, 0x4b, 0x03, 0x04], mimeType: "application/zip", extension: "zip" },
    // EXE
    { bytes: [0x4d, 0x5a], mimeType: "application/x-msdownload", extension: "exe" },
  ];

  for (const sig of signatures) {
    if (buffer.length >= sig.bytes.length) {
      const match = sig.bytes.every((byte, index) => buffer[index] === byte);
      if (match) {
        return {
          mimeType: sig.mimeType,
          extension: sig.extension,
        };
      }
    }
  }

  return null;
}

/**
 * Scan file for malware (placeholder for integration with ClamAV or similar)
 */
export async function scanFileForMalware(
  fileBuffer: Buffer,
  filename: string
): Promise<{ clean: boolean; result: "CLEAN" | "INFECTED" | "UNKNOWN" }> {
  // This is a placeholder. In production, integrate with:
  // - ClamAV (open-source)
  // - VirusTotal API
  // - AWS Macie
  // - Other malware scanning services

  try {
    // For now, perform basic heuristic checks
    const content = fileBuffer.toString("utf-8", 0, Math.min(1000, fileBuffer.length));

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /exec\s*\(/gi,
      /system\s*\(/gi,
      /<script[^>]*>.*?<\/script>/gi,
      /onclick\s*=/gi,
      /onerror\s*=/gi,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return {
          clean: false,
          result: "INFECTED",
        };
      }
    }

    return {
      clean: true,
      result: "CLEAN",
    };
  } catch {
    return {
      clean: true, // Default to clean if scan fails
      result: "UNKNOWN",
    };
  }
}

/**
 * Create file metadata
 */
export function createFileMetadata(
  filename: string,
  originalName: string,
  mimeType: string,
  fileSize: number,
  fileBuffer: Buffer,
  uploadedBy: string,
  malwareScanResult?: "CLEAN" | "INFECTED" | "UNKNOWN"
): FileMetadata {
  return {
    filename,
    originalName,
    mimeType,
    size: fileSize,
    hash: calculateFileHash(fileBuffer),
    uploadedAt: new Date(),
    uploadedBy,
    scanned: !!malwareScanResult,
    malwareScanResult,
  };
}

/**
 * Validate file upload request
 */
export function validateFileUploadRequest(
  fileBuffer: Buffer | null,
  filename: string | null,
  mimeType: string | null,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  if (!fileBuffer || fileBuffer.length === 0) {
    return {
      valid: false,
      error: "No file provided",
    };
  }

  if (!filename || filename.length === 0) {
    return {
      valid: false,
      error: "No filename provided",
    };
  }

  if (!mimeType || mimeType.length === 0) {
    return {
      valid: false,
      error: "No MIME type provided",
    };
  }

  // Validate file
  return validateFile(filename, mimeType, fileBuffer.length, options);
}

/**
 * S3 bucket security policy template
 */
export const S3_BUCKET_SECURITY_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "DenyUnencryptedObjectUploads",
      Effect: "Deny",
      Principal: "*",
      Action: "s3:PutObject",
      Resource: "arn:aws:s3:::BUCKET_NAME/*",
      Condition: {
        StringNotEquals: {
          "s3:x-amz-server-side-encryption": "AES256",
        },
      },
    },
    {
      Sid: "DenyIncorrectKmsKey",
      Effect: "Deny",
      Principal: "*",
      Action: "s3:PutObject",
      Resource: "arn:aws:s3:::BUCKET_NAME/*",
      Condition: {
        StringNotEquals: {
          "s3:x-amz-server-side-encryption-aws-kms-key-id":
            "arn:aws:kms:REGION:ACCOUNT_ID:key/KEY_ID",
        },
      },
    },
    {
      Sid: "DenyUnencryptedTransport",
      Effect: "Deny",
      Principal: "*",
      Action: "s3:*",
      Resource: ["arn:aws:s3:::BUCKET_NAME", "arn:aws:s3:::BUCKET_NAME/*"],
      Condition: {
        Bool: {
          "aws:SecureTransport": "false",
        },
      },
    },
  ],
};

export default {
  validateFileExtension,
  validateMimeType,
  validateFileSize,
  calculateFileHash,
  generateSafeFilename,
  validateFile,
  detectFileType,
  scanFileForMalware,
  createFileMetadata,
  validateFileUploadRequest,
  S3_BUCKET_SECURITY_POLICY,
};
