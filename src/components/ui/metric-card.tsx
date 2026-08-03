import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

const metricCardVariants = cva(
  "relative overflow-hidden transition-all",
  {
    variants: {
      tone: {
        default: "",
        hot: "border-signal-hot/30 surface-hot",
        risk: "border-signal-risk/30 surface-risk",
        ai: "border-signal-ai/30 surface-ai",
        info: "border-signal-info/30",
      },
      size: {
        sm: "min-h-[96px]",
        md: "min-h-[112px]",
        lg: "min-h-[140px]",
      },
    },
    defaultVariants: {
      tone: "default",
      size: "md",
    },
  },
);

const iconWrapVariants = cva(
  "flex items-center justify-center rounded-md",
  {
    variants: {
      tone: {
        default: "bg-primary/10 text-primary",
        hot: "bg-signal-hot/15 text-signal-hot",
        risk: "bg-signal-risk/15 text-signal-risk",
        ai: "bg-signal-ai/15 text-signal-ai",
        info: "bg-signal-info/15 text-signal-info",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export interface MetricCardProps
  extends VariantProps<typeof metricCardVariants> {
  title: string;
  value: string | number;
  suffix?: string;
  icon: ReactNode;
  change?: string;
  trend?: "up" | "down" | "flat";
  className?: string;
}

export function MetricCard({
  title,
  value,
  suffix,
  icon,
  change,
  trend,
  tone,
  size,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(metricCardVariants({ tone, size }), className)}>
      <CardContent className="flex flex-col justify-between p-5 h-full">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("h-9 w-9", iconWrapVariants({ tone }))}>
            {icon}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tabular-nums tracking-tight">
            {value}
            {suffix && (
              <span className="ml-0.5 text-base font-medium text-muted-foreground">
                {suffix}
              </span>
            )}
          </div>
          {(change || trend) && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {trend === "up" && (
                <span className="text-signal-hot">↑</span>
              )}
              {trend === "down" && (
                <span className="text-signal-risk">↓</span>
              )}
              {change && <span>{change}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}