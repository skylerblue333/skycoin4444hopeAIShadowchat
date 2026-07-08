/**
 * VoiceCommandHelp — Help Panel for Voice Commands
 * Shows all available voice commands organized by category.
 * Triggered by a help button (?) in the voice indicator.
 */
import { useState } from "react";
import { X, Mic, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { VOICE_COMMANDS_REGISTRY } from "@/hooks/useVoiceCommands";

interface VoiceCommandHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  Navigation: { text: "text-blue-400", bg: "bg-blue-500/10", dot: "bg-blue-400" },
  Crypto: { text: "text-yellow-400", bg: "bg-yellow-500/10", dot: "bg-yellow-400" },
  Social: { text: "text-pink-400", bg: "bg-pink-500/10", dot: "bg-pink-400" },
  Gaming: { text: "text-green-400", bg: "bg-green-500/10", dot: "bg-green-400" },
  AI: { text: "text-purple-400", bg: "bg-purple-500/10", dot: "bg-purple-400" },
  Platform: { text: "text-cyan-400", bg: "bg-cyan-500/10", dot: "bg-cyan-400" },
};

export function VoiceCommandHelp({ isOpen, onClose }: VoiceCommandHelpProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Navigation", "Crypto"])
  );

  if (!isOpen) return null;

  const grouped = VOICE_COMMANDS_REGISTRY.reduce<Record<string, typeof VOICE_COMMANDS_REGISTRY>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-background border border-border/50 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: "slideUp 200ms cubic-bezier(0.23,1,0.32,1)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mic className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">Voice Commands</h3>
            <p className="text-xs text-muted-foreground">Always listening — just speak</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border-b border-border/30 shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Voice is active — no button needed</span>
          <span className="text-xs text-muted-foreground ml-auto">Alt+V to pause</span>
        </div>

        {/* Command list */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {Object.entries(grouped).map(([category, commands]) => {
            const colors = CATEGORY_COLORS[category] || { text: "text-muted-foreground", bg: "bg-secondary/30", dot: "bg-muted-foreground" };
            const isExpanded = expandedCategories.has(category);
            return (
              <div key={category} className="rounded-xl border border-border/30 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary/30 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className={`text-sm font-semibold ${colors.text}`}>{category}</span>
                  <span className="text-xs text-muted-foreground ml-1">({commands.length})</span>
                  <div className="ml-auto text-muted-foreground">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border/20 divide-y divide-border/10">
                    {commands.map((cmd, i) => (
                      <div key={i} className="px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs font-medium text-foreground">{cmd.command}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">e.g. "{cmd.example}"</div>
                        </div>
                        <div className={`px-2 py-0.5 rounded-lg text-xs ${colors.bg} ${colors.text} shrink-0`}>
                          {category}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-3 border-t border-border/30 bg-secondary/20 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Speak naturally — commands work mid-sentence too
          </p>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
