/**
 * ClickableArea — makes any section header, tag, or label navigable.
 * Usage: <ClickableArea href="/social" label="Social Feed" />
 *        <ClickableArea href="/communities/gaming" label="Gaming" variant="tag" />
 */
import { Link } from "wouter";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "heading" | "tag" | "badge" | "chip" | "inline" | "section";

interface ClickableAreaProps {
  href: string;
  label: string;
  variant?: Variant;
  className?: string;
  icon?: React.ReactNode;
  external?: boolean;
  showArrow?: boolean;
}

export function ClickableArea({
  href,
  label,
  variant = "inline",
  className,
  icon,
  external = false,
  showArrow = false,
}: ClickableAreaProps) {
  const base = "transition-all duration-200 cursor-pointer";

  const styles: Record<Variant, string> = {
    heading:
      "group inline-flex items-center gap-2 font-bold text-foreground hover:text-primary",
    tag:
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40",
    badge:
      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary border border-border hover:border-primary/30",
    chip:
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
    inline:
      "inline-flex items-center gap-1 text-primary hover:text-primary/80 underline-offset-2 hover:underline",
    section:
      "group flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-widest hover:text-primary",
  };

  const content = (
    <>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {showArrow && (
        <ArrowRight
          className={cn(
            "w-3 h-3 shrink-0 transition-transform duration-200",
            variant === "heading" && "group-hover:translate-x-1",
            variant === "section" && "group-hover:translate-x-1"
          )}
        />
      )}
      {external && <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, styles[variant], className)}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(base, styles[variant], className)}>
      {content}
    </Link>
  );
}

/** SectionHeader — a full-width clickable section title with optional "View All" link */
export function SectionHeader({
  title,
  href,
  viewAllHref,
  icon,
  description,
  className,
}: {
  title: string;
  href?: string;
  viewAllHref?: string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div className="flex-1 min-w-0">
        {href ? (
          <Link
            href={href}
            className="group inline-flex items-center gap-2 hover:text-primary transition-colors duration-200"
          >
            {icon && (
              <span className="text-primary shrink-0">{icon}</span>
            )}
            <h2 className="text-xl md:text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
              {title}
            </h2>
            <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2">
            {icon && <span className="text-primary shrink-0">{icon}</span>}
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
          </div>
        )}
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
