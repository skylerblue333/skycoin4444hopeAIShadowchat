/**
 * VOICE COMMAND BAR
 * Floating mic button + live transcript overlay
 * Integrates with useVoiceCommands hook
 */
import { useState } from "react";
import { Mic, MicOff, X, HelpCircle, Keyboard } from "lucide-react";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceCommandBarProps {
  onSearch?: (q: string) => void;
  onLogout?: () => void;
}

export function VoiceCommandBar({ onSearch, onLogout }: VoiceCommandBarProps) {
  const [showHelp, setShowHelp] = useState(false);
  const { isListening, isSupported, transcript, lastCommand, confidence, toggleListening } =
    useVoiceCommands({ onSearch, onLogout });

  if (!isSupported) return null;

  return (
    <>
      {/* Floating Mic Button */}
      <button
        onClick={toggleListening}
        title="Voice commands (Alt+V)"
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center",
          "shadow-2xl transition-all duration-200 active:scale-95",
          isListening
            ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-red-500/50"
            : "bg-[oklch(0.72 0.28 305)] hover:bg-[oklch(0.65_0.2_160)] shadow-[oklch(0.72 0.28 305)]/30"
        )}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-black" />
        )}
        {isListening && (
          <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
        )}
      </button>

      {/* Listening Overlay */}
      {isListening && (
        <div className="fixed bottom-24 right-6 z-50 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl max-w-xs w-72">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Listening…</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+V</span>
          </div>
          {transcript ? (
            <p className="text-sm text-foreground font-medium">"{transcript}"</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Say a command…</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {["Go to staking", "Swap SKY444", "Search for…", "Burn tokens", "Play arcade"].map(hint => (
              <span key={hint} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                {hint}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Last Command Toast-style indicator */}
      {lastCommand && !isListening && (
        <div className="fixed bottom-24 right-6 z-50 bg-[oklch(0.72 0.28 305)]/10 border border-[oklch(0.72 0.28 305)]/30 rounded-xl px-3 py-2 shadow-lg max-w-xs">
          <p className="text-xs text-[oklch(0.72 0.28 305)]">
            ✓ "{lastCommand}"
            {confidence > 0 && (
              <span className="ml-1 text-muted-foreground">({Math.round(confidence * 100)}%)</span>
            )}
          </p>
        </div>
      )}

      {/* Help Button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="fixed bottom-6 right-24 z-50 w-10 h-10 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"
        title="Voice command help"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Help Panel */}
      {showHelp && (
        <div className="fixed bottom-20 right-6 z-50 bg-background/98 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-2xl w-80 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Mic className="w-4 h-4 text-[oklch(0.72 0.28 305)]" />
              Voice Commands
            </h3>
            <button onClick={() => setShowHelp(false)}>
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-secondary/30">
            <Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Press <kbd className="px-1 py-0.5 rounded bg-secondary text-foreground text-[10px]">Alt+V</kbd> to toggle</span>
          </div>
          {[
            { cat: "🧭 Navigation", cmds: ["Go to staking", "Go to marketplace", "Go to arcade", "Go home", "Go back"] },
            { cat: "💰 Crypto", cmds: ["Stake 1000 SKY", "Swap SKY444 to USDT", "Burn 500 tokens", "Buy SKY444", "Sell ETH", "Open wallet", "Check balance"] },
            { cat: "🤝 Social", cmds: ["Create post", "Open messages", "Open notifications", "Search for SKY444"] },
            { cat: "🎮 Gaming", cmds: ["Play snake", "Open arcade", "Go to tournaments"] },
            { cat: "🤖 AI", cmds: ["Open AI engineer", "Open Hope AI", "Go to analytics"] },
            { cat: "⚙️ Platform", cmds: ["Go to settings", "Go to admin", "Logout", "Help"] },
          ].map(section => (
            <div key={section.cat} className="mb-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{section.cat}</p>
              {section.cmds.map(cmd => (
                <div key={cmd} className="flex items-center gap-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72 0.28 305)]/50 shrink-0" />
                  <span className="text-xs text-foreground/80 font-mono">"{cmd}"</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
