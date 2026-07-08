/**
 * AchievementToast — Cinematic achievement unlock notifications
 * Appears from bottom-right with glow, sound cue, and rarity color
 */
import { useState, useEffect, useCallback } from "react";
import { Star, Zap, Trophy, Shield, Flame, Crown } from "lucide-react";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: Rarity;
}

const RARITY_CONFIG: Record<Rarity, { border: string; glow: string; badge: string; label: string; icon: typeof Star }> = {
  common:    { border: "border-slate-400/50",   glow: "shadow-slate-400/20",   badge: "bg-slate-700 text-slate-300",   label: "Common",    icon: Star    },
  rare:      { border: "border-blue-400/60",    glow: "shadow-blue-400/30",    badge: "bg-blue-900/80 text-blue-300",  label: "Rare",      icon: Shield  },
  epic:      { border: "border-purple-400/70",  glow: "shadow-purple-400/40",  badge: "bg-purple-900/80 text-purple-300", label: "Epic",   icon: Zap     },
  legendary: { border: "border-amber-400/80",   glow: "shadow-amber-400/50",   badge: "bg-amber-900/80 text-amber-300",label: "Legendary", icon: Crown   },
};

interface ToastItem extends Achievement {
  toastId: string;
  visible: boolean;
}

let _addToast: ((a: Achievement) => void) | null = null;

export function triggerAchievement(achievement: Achievement) {
  _addToast?.(achievement);
}

export function AchievementToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((achievement: Achievement) => {
    const toastId = `${achievement.id}-${Date.now()}`;
    setToasts(prev => [...prev, { ...achievement, toastId, visible: false }]);
    // Trigger entrance animation
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.toastId === toastId ? { ...t, visible: true } : t));
    }, 50);
    // Auto-dismiss after 5s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.toastId === toastId ? { ...t, visible: false } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
      }, 500);
    }, 5000);
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map(toast => {
        const cfg = RARITY_CONFIG[toast.rarity];
        const RarityIcon = cfg.icon;
        return (
          <div
            key={toast.toastId}
            className={`pointer-events-auto w-80 rounded-xl border ${cfg.border} bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl ${cfg.glow} transition-all duration-500 ${
              toast.visible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-8 scale-95"
            }`}
          >
            {/* Rarity shimmer line */}
            {toast.rarity === "legendary" && (
              <div className="h-0.5 w-full rounded-t-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-shimmer" />
            )}
            {toast.rarity === "epic" && (
              <div className="h-0.5 w-full rounded-t-xl bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-500 animate-shimmer" />
            )}

            <div className="p-4 flex items-start gap-3">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                toast.rarity === "legendary" ? "bg-amber-500/20 ring-1 ring-amber-400/50" :
                toast.rarity === "epic"      ? "bg-purple-500/20 ring-1 ring-purple-400/50" :
                toast.rarity === "rare"      ? "bg-blue-500/20 ring-1 ring-blue-400/50" :
                "bg-white/5 ring-1 ring-white/10"
              }`}>
                {toast.icon}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Achievement Unlocked!</span>
                </div>

                {/* Title */}
                <div className={`font-bold text-sm leading-tight ${
                  toast.rarity === "legendary" ? "text-amber-300" :
                  toast.rarity === "epic"      ? "text-purple-300" :
                  toast.rarity === "rare"      ? "text-blue-300" :
                  "text-white"
                }`}>
                  {toast.title}
                </div>

                {/* Description */}
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{toast.description}</div>

                {/* Footer */}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge} flex items-center gap-1`}>
                    <RarityIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    +{toast.xpReward} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Sample achievements for testing ──────────────────────────────────────────
export const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  { id: "first_post",     title: "First Post!",         description: "You made your first post on SKYCOIN4444",  icon: "✍️",  xpReward: 100,  rarity: "common"    },
  { id: "first_stake",    title: "Staker",               description: "You staked SKY444 tokens for the first time", icon: "💎", xpReward: 250,  rarity: "rare"      },
  { id: "7_day_streak",   title: "7-Day Streak!",        description: "Logged in 7 days in a row",               icon: "🔥",  xpReward: 500,  rarity: "rare"      },
  { id: "first_invest",   title: "Early Investor",       description: "Participated in the ICO",                 icon: "🚀",  xpReward: 1000, rarity: "epic"      },
  { id: "whale",          title: "Whale Alert",          description: "Held 10,000+ SKY444 tokens",              icon: "🐋",  xpReward: 2500, rarity: "legendary" },
  { id: "charity_donor",  title: "Philanthropist",       description: "Donated to a charity campaign",           icon: "❤️",  xpReward: 300,  rarity: "rare"      },
  { id: "first_stream",   title: "Streamer",             description: "Went live for the first time",            icon: "📡",  xpReward: 500,  rarity: "rare"      },
  { id: "course_complete","title": "Scholar",            description: "Completed your first SkySchool course",   icon: "🎓",  xpReward: 750,  rarity: "epic"      },
];
