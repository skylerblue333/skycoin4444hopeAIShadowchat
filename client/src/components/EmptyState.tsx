import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {icon && (
        <div className="text-5xl mb-4 opacity-60">
          {typeof icon === "string" ? icon : icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm max-w-xs mb-4" style={{ color: 'oklch(0.55 0.025 275)' }}>
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="text-white font-semibold"
          style={{ background: 'linear-gradient(135deg, oklch(0.72 0.28 305), oklch(0.72 0.28 340))', border: 'none' }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
