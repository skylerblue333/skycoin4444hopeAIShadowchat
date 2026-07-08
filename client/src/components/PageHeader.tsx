import { LucideIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  backHref?: string;
  actions?: React.ReactNode;
  gradient?: boolean;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeVariant = "default",
  backHref,
  actions,
  gradient = true,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-8 animate-page-in ${className}`}>
      {backHref && (
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${gradient ? "text-gradient" : "text-foreground"}`}>
                {title}
              </h1>
              {badge && (
                <Badge variant={badgeVariant} className="text-xs font-medium">
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-muted-foreground text-sm mt-1 max-w-xl">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
