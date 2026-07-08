import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

/* Accent palette matching the reference tiles */
export const ACCENTS = {
  cyan: { fg: "oklch(0.82 0.15 200)", bg: "oklch(0.30 0.08 200 / 0.25)" },
  green: { fg: "oklch(0.80 0.18 150)", bg: "oklch(0.30 0.09 150 / 0.22)" },
  purple: { fg: "oklch(0.70 0.2 295)", bg: "oklch(0.30 0.1 295 / 0.25)" },
  amber: { fg: "oklch(0.82 0.16 80)", bg: "oklch(0.32 0.09 80 / 0.22)" },
  magenta: { fg: "oklch(0.70 0.23 350)", bg: "oklch(0.32 0.12 350 / 0.22)" },
  orange: { fg: "oklch(0.74 0.17 55)", bg: "oklch(0.32 0.1 55 / 0.22)" },
} as const;

export type Accent = keyof typeof ACCENTS;

export function IconTile({ icon: Icon, accent = "cyan", className = "" }: { icon: LucideIcon; accent?: Accent; className?: string }) {
  const a = ACCENTS[accent];
  return (
    <span className={`sk-tile ${className}`} style={{ background: a.bg }}>
      <Icon className="w-6 h-6" style={{ color: a.fg }} />
    </span>
  );
}

export function Card({ children, className = "", hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={`sk-card ${hover ? "sk-card-hover" : ""} ${className}`}>{children}</div>;
}

export function ChangePill({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={up ? "sk-pill-up" : "sk-pill-down"}>
      {up ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

export function StatCard({ icon, accent = "cyan", label, value }: { icon: LucideIcon; accent?: Accent; label: string; value: ReactNode }) {
  return (
    <Card className="p-5 flex items-center gap-4" hover>
      <IconTile icon={icon} accent={accent} />
      <div className="min-w-0">
        <div className="text-2xl font-extrabold truncate">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

/* Module tile like the reference dashboard cards (icon + title + subtext) */
export function ModuleTile({ icon, accent, title, subtitle, onClick }: { icon: LucideIcon; accent: Accent; title: string; subtitle: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="p-6 h-full" hover>
        <IconTile icon={icon} accent={accent} />
        <div className="mt-5 text-xl font-bold">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
      </Card>
    </button>
  );
}

/* Tiny SVG sparkline used in token cards */
export function Sparkline({ points, color, height = 64 }: { points: number[]; color: string; height?: number }) {
  const w = 320;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(height - ((p - min) / span) * (height - 8) - 4).toFixed(1)}`)
    .join(" ");
  const lastX = (points.length - 1) * step;
  const lastY = height - ((points[points.length - 1] - min) / span) * (height - 8) - 4;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={4} fill={color} />
    </svg>
  );
}
