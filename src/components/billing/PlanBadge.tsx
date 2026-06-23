import type { Plan } from "@/types/subscription";

const PLAN_STYLES: Record<Plan, string> = {
  free: "bg-slate-100 text-slate-700",
  pro: "bg-violet-100 text-violet-800",
  team: "bg-amber-100 text-amber-800",
};

const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

interface PlanBadgeProps {
  plan: Plan;
  className?: string;
}

export function PlanBadge({ plan, className = "" }: PlanBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PLAN_STYLES[plan]} ${className}`}
    >
      {PLAN_LABELS[plan]}
    </span>
  );
}