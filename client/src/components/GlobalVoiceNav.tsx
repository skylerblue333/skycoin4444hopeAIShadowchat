/**
 * GlobalVoiceNav — display-only ambient voice status indicator
 *
 * IMPORTANT: This component does NOT create its own SpeechRecognition instance.
 * It reads from the shared useGlobalVoiceEngine singleton (module-level).
 * The nav bar mic button in TopCommandBar is the single toggle control.
 *
 * This component only shows a subtle ambient transcript toast when a command fires.
 */
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { useGlobalVoiceEngine } from "@/hooks/useGlobalVoiceEngine";

export function GlobalVoiceNav() {
  const [voiceState] = useGlobalVoiceEngine();
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLabel = useRef<string | null>(null);

  // Show a brief toast when a command is recognized
  useEffect(() => {
    if (
      voiceState.lastCommandLabel &&
      voiceState.lastCommandLabel !== prevLabel.current
    ) {
      prevLabel.current = voiceState.lastCommandLabel;
      setShowToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowToast(false), 2200);
    }
  }, [voiceState.lastCommandLabel]);

  if (!voiceState.supported) return null;
  if (!showToast || !voiceState.lastCommandLabel) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-[200] flex flex-col items-end gap-1 pointer-events-none"
      style={{ animation: "voiceToastIn 160ms cubic-bezier(0.23,1,0.32,1)" }}
    >
      {/* Transcript */}
      {voiceState.transcript && (
        <div
          className="max-w-[200px] px-3 py-1.5 rounded-xl text-[11px] text-slate-300 leading-snug"
          style={{
            background: "oklch(0.12 0.03 275 / 0.92)",
            border: "1px solid oklch(0.30 0.05 275 / 0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span className="text-slate-500 mr-1">"</span>
          {voiceState.transcript}
          <span className="text-slate-500">"</span>
        </div>
      )}
      {/* Command label */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-cyan-300"
        style={{
          background: "oklch(0.12 0.03 275 / 0.92)",
          border: "1px solid oklch(0.72 0.28 200 / 0.3)",
          backdropFilter: "blur(12px)",
        }}
      >
        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
        <span>{voiceState.lastCommandLabel}</span>
        <ChevronRight className="w-3 h-3 text-cyan-500 shrink-0" />
      </div>

      <style>{`
        @keyframes voiceToastIn {
          from { opacity:0; transform:translateY(6px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
