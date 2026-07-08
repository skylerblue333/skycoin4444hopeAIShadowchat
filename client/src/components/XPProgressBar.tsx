import { Link } from "wouter";
import { Zap } from "lucide-react";

interface XPProgressBarProps {
  xp?: number;
  level?: number;
  compact?: boolean;
}

export function XPProgressBar({ xp = 1250, level = 7, compact = false }: XPProgressBarProps) {
  const xpForNextLevel = (level + 1) * 500;
  const xpForCurrentLevel = level * 500;
  const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  if (compact) {
    return (
      <Link href="/profile">
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-500">Lv.{level}</span>
          </div>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{xp.toLocaleString()} XP</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/profile">
      <div className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{level}</span>
            </div>
            <div>
              <div className="text-sm font-semibold">Level {level}</div>
              <div className="text-xs text-muted-foreground">Sky Pioneer</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-yellow-500">{xp.toLocaleString()} XP</div>
            <div className="text-xs text-muted-foreground">{(xpForNextLevel - xp).toLocaleString()} to next</div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
