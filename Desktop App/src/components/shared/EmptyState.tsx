import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center",
        compact ? "py-8 px-3" : "py-12 px-4",
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "mx-auto mb-3 text-muted-foreground/50",
            compact ? "h-6 w-6" : "h-10 w-10",
          )}
        />
      )}
      <p
        className={cn(
          "font-medium mb-1",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {title}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
