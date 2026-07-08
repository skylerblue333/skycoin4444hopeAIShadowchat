import { Link } from "wouter";
import { CheckCircle2, Circle, Zap, Gift } from "lucide-react";
import { useState } from "react";

const DAILY_QUESTS = [
  { id: 1, label: "Post something today", xp: 50, done: false },
  { id: 2, label: "Like 3 posts", xp: 30, done: false },
  { id: 3, label: "Follow a creator", xp: 40, done: false },
  { id: 4, label: "Stake SKY444 tokens", xp: 100, done: false },
  { id: 5, label: "Visit the Arcade", xp: 25, done: false },
];

export function DailyQuestWidget() {
  const [quests, setQuests] = useState(DAILY_QUESTS);
  const completed = quests.filter(q => q.done).length;
  const totalXP = quests.filter(q => q.done).reduce((sum, q) => sum + q.xp, 0);
  const maxXP = quests.reduce((sum, q) => sum + q.xp, 0);
  const pct = Math.round((completed / quests.length) * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold">Daily Quests</span>
        </div>
        <Link href="/quests">
          <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{completed}/{quests.length} done</span>
          <span>{totalXP}/{maxXP} XP</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {quests.map(quest => (
          <button
            key={quest.id}
            onClick={() => setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, done: !q.done } : q))}
            className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            {quest.done
              ? <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
              : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            }
            <span className={`text-sm flex-1 ${quest.done ? "line-through text-muted-foreground" : ""}`}>
              {quest.label}
            </span>
            <span className="text-xs text-yellow-500 font-medium">+{quest.xp} XP</span>
          </button>
        ))}
      </div>

      {completed === quests.length && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-purple-600/10 rounded-lg border border-purple-500/20">
          <Gift className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-purple-400 font-medium">All quests complete! Claim your reward →</span>
        </div>
      )}
    </div>
  );
}
