import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground border-border",
        destructive:
          "border-transparent bg-signal-risk text-white hover:bg-signal-risk/90",

        // === Signal variants ===
        hot: "border-transparent bg-signal-hot text-white hover:bg-signal-hot/90",
        good: "border-transparent bg-signal-good text-white hover:bg-signal-good/90",
        watch:
          "border-transparent bg-signal-watch text-white hover:bg-signal-watch/90",
        cold: "border-transparent bg-signal-cold text-white hover:bg-signal-cold/90",
        risk: "border-transparent bg-signal-risk text-white hover:bg-signal-risk/90",
        ai: "border-transparent bg-signal-ai text-white hover:bg-signal-ai/90",
        info: "border-transparent bg-signal-info text-white hover:bg-signal-info/90",

        // === Soft variants (for pills on cards) ===
        "hot-soft":
          "border-signal-hot/30 bg-signal-hot-soft text-signal-hot-foreground",
        "good-soft":
          "border-signal-good/30 bg-signal-good-soft text-signal-good-foreground",
        "watch-soft":
          "border-signal-watch/30 bg-signal-watch-soft text-signal-watch-foreground",
        "cold-soft":
          "border-signal-cold/30 bg-signal-cold-soft text-signal-cold-foreground",
        "risk-soft":
          "border-signal-risk/30 bg-signal-risk-soft text-signal-risk-foreground",
        "ai-soft":
          "border-signal-ai/30 bg-signal-ai-soft text-signal-ai-foreground",
        "info-soft":
          "border-signal-info/30 bg-signal-info-soft text-signal-info-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode;
}

export function Badge({ children, variant, className, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

export { badgeVariants };

/**
 * Map a 0-100 score to a Badge variant.
 *   ≥90 hot | ≥75 good | ≥60 watch | ≥40 cold | else risk
 */
export function scoreVariant(
  score: number,
): VariantProps<typeof badgeVariants>["variant"] {
  if (score >= 90) return "hot";
  if (score >= 75) return "good";
  if (score >= 60) return "watch";
  if (score >= 40) return "cold";
  return "risk";
}

/**
 * Map a recommendation string ("Strong Buy" | "Buy" | "Watch" | "Pass" | "Reject")
 * to a Badge variant. Centralized so every surface looks the same.
 */
export function recommendationVariant(
  rec?: string | null,
): VariantProps<typeof badgeVariants>["variant"] {
  if (!rec) return "cold-soft";
  const normalized = rec.toUpperCase().replace(/\s+/g, "_");
  if (normalized === "STRONG_BUY") return "hot";
  if (normalized === "BUY") return "good";
  if (normalized === "WATCH" || normalized === "HOLD") return "watch";
  if (normalized === "PASS") return "cold";
  if (normalized === "REJECT") return "risk";
  return "outline";
}

/**
 * Map pipeline / job status to a Badge variant.
 */
export function statusVariant(
  status?: string | null,
): VariantProps<typeof badgeVariants>["variant"] {
  if (!status) return "cold-soft";
  const s = status.toLowerCase();
  if (s === "success" || s === "completed" || s === "passed") return "hot-soft";
  if (s === "running" || s === "pending") return "info-soft";
  if (s === "failed" || s === "error") return "risk-soft";
  if (s === "watch" || s === "partial") return "watch-soft";
  return "outline";
}