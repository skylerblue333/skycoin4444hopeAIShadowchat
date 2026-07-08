import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  color?: "primary" | "accent" | "success" | "warning" | "destructive" | "gold";
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const colorMap = {
  primary: "text-primary bg-primary/10 border-primary/20",
  accent: "text-accent bg-accent/10 border-accent/20",
  success: "text-success bg-success/10 border-success/20",
  warning: "text-warning bg-warning/10 border-warning/20",
  destructive: "text-destructive bg-destructive/10 border-destructive/20",
  gold: "text-cyber-gold bg-cyber-gold/10 border-cyber-gold/20",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  color = "primary",
  loading = false,
  className = "",
  onClick,
}: StatCardProps) {
  const colorClass = colorMap[color];
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  if (loading) {
    return (
      <div className={`card p-5 ${className}`}>
        <div className="skeleton h-4 w-24 mb-3 rounded" />
        <div className="skeleton h-8 w-32 mb-2 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  return (
    <div
      className={`card p-5 transition-all duration-200 ${onClick ? "cursor-pointer hover:border-primary/40 hover:shadow-glow-sm" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-success" : isNegative ? "text-destructive" : "text-muted-foreground"}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          <span>{isPositive ? "+" : ""}{change}%</span>
          {changeLabel && <span className="text-muted-foreground font-normal">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
