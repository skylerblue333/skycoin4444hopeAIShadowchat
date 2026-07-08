/**
 * AlwaysOnVoice — Top-left voice command indicator with mute/unmute control
 *
 * - Starts MUTED — user clicks the right-side button to unmute
 * - When unmuted: always-on, auto-restarts, collects commands
 * - Mute button is on the RIGHT side of the pill
 * - Shows live transcript and matched command label when active
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Loader2, Radio, VolumeX, Volume2 } from "lucide-react";
import { useGlobalVoiceEngine } from "@/hooks/useGlobalVoiceEngine";

// Module-level mute state so it persists across re-renders
let _muted = true; // starts muted

export function AlwaysOnVoice() {
  const [voiceState] = useGlobalVoiceEngine();
  const [muted, setMuted] = useState(_muted);
  const [showCommand, setShowCommand] = useState(false);
  const commandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLabel = useRef<string | null>(null);

  // Flash command label briefly when a command fires
  useEffect(() => {
    if (
      voiceState.lastCommandLabel &&
      voiceState.lastCommandLabel !== prevLabel.current
    ) {
      prevLabel.current = voiceState.lastCommandLabel;
      setShowCommand(true);
      if (commandTimer.current) clearTimeout(commandTimer.current);
      commandTimer.current = setTimeout(() => setShowCommand(false), 2500);
    }
  }, [voiceState.lastCommandLabel]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    _muted = next;
    setMuted(next);
    // Control the engine via the module-level flag
    const engineModule = (window as any).__voiceEngine;
    if (engineModule) {
      if (next) engineModule.pause();
      else engineModule.resume();
    }
    // Also dispatch a custom event the engine hook listens to
    window.dispatchEvent(new CustomEvent("voice-mute-toggle", { detail: { muted: next } }));
  }, [muted]);

  if (!voiceState.supported) return null;
  if (voiceState.status === "denied") return null;

  const isListening  = !muted && voiceState.status === "listening";
  const isProcessing = !muted && voiceState.status === "processing";
  const isConnecting = !muted && (voiceState.status === "restarting" || voiceState.status === "starting");

  return (
    <div
      className="fixed top-[52px] left-3 z-[300] flex flex-col items-start gap-1 pointer-events-none"
      style={{ maxWidth: 240 }}
    >
      {/* Main status pill */}
      <div
        className="flex items-center gap-1.5 rounded-full overflow-hidden"
        style={{
          background: isListening
            ? "oklch(0.14 0.06 200 / 0.88)"
            : "oklch(0.10 0.02 275 / 0.75)",
          border: isListening
            ? "1px solid oklch(0.72 0.28 200 / 0.35)"
            : "1px solid oklch(0.25 0.04 275 / 0.35)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Left: status icon + label */}
        <div
          className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 text-[11px] font-medium"
          style={{ color: isListening ? "oklch(0.80 0.20 200)" : "oklch(0.45 0.04 275)" }}
        >
          {isProcessing ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
          ) : isConnecting ? (
            <Radio className="w-2.5 h-2.5 shrink-0 opacity-60" />
          ) : muted ? (
            <MicOff className="w-2.5 h-2.5 shrink-0" />
          ) : (
            <span className="relative flex shrink-0">
              <Mic className="w-2.5 h-2.5 shrink-0" />
              {isListening && (
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: "oklch(0.72 0.28 200 / 0.4)", animationDuration: "2s" }}
                />
              )}
            </span>
          )}
          <span>
            {muted        ? "Muted"        :
             isProcessing ? "Heard you…"   :
             isConnecting ? "Connecting…"  :
             isListening  ? "Listening"    :
             "Voice"}
          </span>
          {isListening && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          )}
        </div>

        {/* Right: mute/unmute button — pointer-events-auto */}
        <button
          onClick={toggleMute}
          className="pointer-events-auto flex items-center justify-center w-6 h-6 mr-1 rounded-full transition-all duration-150 hover:scale-110 active:scale-95"
          style={{
            background: muted
              ? "oklch(0.20 0.04 275 / 0.6)"
              : "oklch(0.72 0.28 200 / 0.20)",
            color: muted ? "oklch(0.55 0.05 275)" : "oklch(0.72 0.28 200)",
          }}
          title={muted ? "Unmute voice commands" : "Mute voice commands"}
        >
          {muted
            ? <VolumeX className="w-3 h-3" />
            : <Volume2 className="w-3 h-3" />
          }
        </button>
      </div>

      {/* Live transcript */}
      {isListening && voiceState.transcript && (
        <div
          className="px-2 py-1 rounded-lg text-[10px] leading-snug max-w-full truncate"
          style={{
            background: "oklch(0.10 0.02 275 / 0.82)",
            border: "1px solid oklch(0.25 0.04 275 / 0.4)",
            backdropFilter: "blur(8px)",
            color: "oklch(0.65 0.05 275)",
            animation: "voiceFadeIn 120ms ease-out",
          }}
        >
          {voiceState.transcript}
        </div>
      )}

      {/* Command matched */}
      {showCommand && voiceState.lastCommandLabel && !muted && (
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold"
          style={{
            background: "oklch(0.12 0.06 200 / 0.92)",
            border: "1px solid oklch(0.72 0.28 200 / 0.35)",
            backdropFilter: "blur(10px)",
            color: "oklch(0.80 0.20 200)",
            animation: "voiceFadeIn 160ms cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <span className="text-cyan-400">✓</span>
          <span>{voiceState.lastCommandLabel}</span>
        </div>
      )}

      <style>{`
        @keyframes voiceFadeIn {
          from { opacity:0; transform:translateY(-3px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
