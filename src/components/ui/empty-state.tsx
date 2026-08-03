import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

/**
 * Friendly empty state used wherever the dashboard would otherwise show
 * a sad "No data available". Always Vietnamese; pairs with a CTA so the
 * user knows how to fill the panel.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Button asChild={!!action.href} variant="outline" size="sm">
            {action.href ? (
              <a href={action.href}>{action.label}</a>
            ) : (
              <button type="button" onClick={action.onClick}>
                {action.label}
              </button>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}