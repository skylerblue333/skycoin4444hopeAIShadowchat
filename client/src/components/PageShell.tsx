import { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface Breadcrumb { label: string; href?: string; }

interface PageShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
  badgeColor?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Accent color class for the header glow, e.g. "from-cyan-500/20 to-blue-500/5" */
  gradient?: string;
}

export function PageShell({
  title, subtitle, icon, badge, badgeColor = "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  breadcrumbs, actions, children, className = "", gradient = "from-cyan-500/10 via-transparent to-transparent"
}: PageShellProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Page header */}
      <div className={`relative border-b border-border/40 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative max-w-screen-xl mx-auto px-4 lg:px-6 py-6">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Link href="/"><Home className="w-3 h-3 hover:text-foreground transition-colors" /></Link>
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 opacity-40" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors">{crumb.label}</Link>
                  ) : (
                    <span className="text-foreground/80">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
                  {badge && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {badge}
                    </span>
                  )}
                </div>
                {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </div>
      </div>
      {/* Page content */}
      <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-6">
        {children}
      </div>
    </div>
  );
}

/** Stat card for use inside PageShell */
export function StatTile({
  label, value, sub, icon, color = "text-cyan-400", trend
}: {
  label: string; value: string | number; sub?: string;
  icon?: ReactNode; color?: string; trend?: { value: string; up: boolean };
}) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-1 ${trend.up ? "text-purple-400" : "text-red-400"}`}>
              {trend.up ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {icon && <div className={`${color} opacity-70`}>{icon}</div>}
      </div>
    </div>
  );
}

/** Section divider with label */
export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-foreground">{children}</h2>
      {action && <div className="text-sm text-muted-foreground">{action}</div>}
    </div>
  );
}
