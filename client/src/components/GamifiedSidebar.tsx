/**
 * GamifiedSidebar — Live XP bar, streak tracker, daily quests, spin wheel CTA
 * Shown on desktop as a right-side panel on social/gaming/creator pages
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { Flame, Zap, Star, Trophy, Gift, Target, ChevronRight, Coins, Crown, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { triggerAchievement, SAMPLE_ACHIEVEMENTS } from "./AchievementToast";

function XPBar({ xp, level }: { xp: number; level: number }) {
  const xpForLevel = level * 500;
  const xpInLevel = xp % xpForLevel;
  const pct = Math.min(100, Math.round((xpInLevel / xpForLevel) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Level {level}</span>
        <span className="text-amber-400 font-bold">{xp.toLocaleString()} XP</span>
        <span className="text-muted-foreground">Level {level + 1}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-1000 relative"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-white/30 animate-shimmer rounded-full" />
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground">{pct}% to next level</div>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  const color = streak >= 30 ? "text-amber-400" : streak >= 14 ? "text-orange-400" : streak >= 7 ? "text-yellow-400" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
      <Flame className={`w-5 h-5 ${color}`} />
      <div>
        <div className={`text-sm font-bold ${color}`}>{streak} Day Streak</div>
        <div className="text-xs text-muted-foreground">{streak >= 7 ? "🔥 On fire!" : "Keep it up!"}</div>
      </div>
    </div>
  );
}

const DAILY_QUESTS = [
  { id: "post",     label: "Post something",     xp: 50,  icon: "✍️",  done: false },
  { id: "like",     label: "Like 5 posts",        xp: 25,  icon: "❤️",  done: false },
  { id: "login",    label: "Daily login",         xp: 25,  icon: "✅",  done: true  },
  { id: "comment",  label: "Leave a comment",     xp: 30,  icon: "💬",  done: false },
  { id: "spin",     label: "Spin the wheel",      xp: 10,  icon: "🎡",  done: false },
];

export function GamifiedSidebar() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [spinClaimed, setSpinClaimed] = useState(false);

  const { data: gameState } = trpc.gamification.getState.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  const recordLogin = trpc.gamification.recordLogin.useMutation({
    onSuccess: (data: any) => {
      if (data.xpAwarded > 0 && data.streak && data.streak >= 7) {
        triggerAchievement(SAMPLE_ACHIEVEMENTS.find(a => a.id === "7_day_streak")!);
      }
    },
  });

  // Record login on mount
  useState(() => {
    if (user) recordLogin.mutate();
  });

  const xp = (gameState as any)?.user?.xp ?? gameState?.xp ?? 0;
  const level = (gameState as any)?.user?.level ?? gameState?.level ?? 1;
  const streak = (gameState as any)?.streak?.currentStreak ?? 0;
  const hasSpun = (gameState as any)?.hasSpunToday ?? false;

  const completedQuests = DAILY_QUESTS.filter(q => q.done || (q.id === "spin" && hasSpun)).length;
  const totalQuestXP = DAILY_QUESTS.filter(q => !q.done && !(q.id === "spin" && hasSpun)).reduce((s, q) => s + q.xp, 0);

  if (!user) return null;

  return (
    <div className="w-72 flex-shrink-0 space-y-4">
      {/* XP Card */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Your Progress</div>
            <div className="text-xs text-muted-foreground">Level {level} Explorer</div>
          </div>
        </div>
        <XPBar xp={xp} level={level} />
        <StreakBadge streak={streak} />
      </div>

      {/* Daily Quests */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">Daily Quests</span>
          </div>
          <span className="text-xs text-cyan-400 font-medium">{completedQuests}/{DAILY_QUESTS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${(completedQuests / DAILY_QUESTS.length) * 100}%` }}
          />
        </div>

        <div className="space-y-2">
          {DAILY_QUESTS.map(quest => {
            const done = quest.done || (quest.id === "spin" && hasSpun);
            return (
              <div
                key={quest.id}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                  done ? "opacity-50" : "hover:bg-white/5"
                }`}
                onClick={() => {
                  if (!done && quest.id === "spin") navigate("/spin");
                }}
              >
                <span className="text-base">{quest.icon}</span>
                <span className={`flex-1 text-xs ${done ? "line-through text-muted-foreground" : "text-white"}`}>
                  {quest.label}
                </span>
                <span className={`text-xs font-bold ${done ? "text-muted-foreground" : "text-amber-400"}`}>
                  +{quest.xp} XP
                </span>
                {done && <span className="text-green-400 text-xs">✓</span>}
              </div>
            );
          })}
        </div>

        {totalQuestXP > 0 && (
          <div className="text-xs text-center text-muted-foreground">
            Complete all quests for <span className="text-amber-400 font-bold">+{totalQuestXP} XP</span>
          </div>
        )}
      </div>

      {/* Spin Wheel CTA */}
      {!hasSpun && (
        <button
          onClick={() => navigate("/spin")}
          className="w-full rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 p-4 text-left hover:border-amber-400/60 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🎡
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-amber-300">Daily Spin Available!</div>
              <div className="text-xs text-muted-foreground">Win XP, SKY444, or badges</div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}

      {/* Battle Pass Teaser */}
      <div
        className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/5 p-4 cursor-pointer hover:border-purple-400/50 transition-all group"
        onClick={() => navigate("/battle-pass")}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Crown className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-300">Battle Pass S1</div>
            <div className="text-xs text-muted-foreground">
              Tier {(gameState as any)?.battlePass?.currentTier ?? 0}/50
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </div>
        {/* Tier progress */}
        <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
            style={{ width: `${(((gameState as any)?.battlePass?.currentTier ?? 0) / 50) * 100}%` }}
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Badges",   value: (gameState as any)?.badges?.length ?? 0, icon: Trophy,  color: "text-amber-400" },
          { label: "Streak",   value: streak,                          icon: Flame,   color: "text-orange-400" },
          { label: "Level",    value: level,                           icon: Zap,     color: "text-cyan-400"   },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/3 p-2 text-center">
              <Icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
              <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
