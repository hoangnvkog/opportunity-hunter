"use client";

import type { Plan } from "@/types/subscription";

const PLAN_LIMITS: Record<
  Plan,
  {
    opportunities: number | null;
    insights: number | null;
    emails: number | null;
  }
> = {
  free: { opportunities: 50, insights: 20, emails: 5 },
  pro: { opportunities: 500, insights: 200, emails: 100 },
  team: { opportunities: null, insights: null, emails: null },
};

interface UsageProgressProps {
  plan: Plan;
  opportunities_used: number;
  insights_used: number;
  emails_sent: number;
  className?: string;
}

function ProgressBar({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number | null;
  label: string;
}) {
  const isUnlimited = limit === null;
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const color =
    percentage >= 90
      ? "bg-rose-500"
      : percentage >= 70
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used}
          {isUnlimited ? " / ∞" : ` / ${limit}`}
        </span>
      </div>
      {isUnlimited ? (
        <div className="h-2 rounded-full bg-emerald-100" />
      ) : (
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={`h-2 rounded-full transition-all ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function UsageProgress({
  plan,
  opportunities_used,
  insights_used,
  emails_sent,
  className = "",
}: UsageProgressProps) {
  const limits = PLAN_LIMITS[plan];

  return (
    <div className={`space-y-3 ${className}`}>
      <ProgressBar
        used={opportunities_used}
        limit={limits.opportunities}
        label="Opportunities"
      />
      <ProgressBar used={insights_used} limit={limits.insights} label="Insights" />
      <ProgressBar used={emails_sent} limit={limits.emails} label="Emails sent" />
    </div>
  );
}

// Helper to get limits (can be called server-side)
export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan];
}

// Check if a user is within plan limits
export function checkPlanLimit(
  plan: Plan,
  opportunities_used: number,
  insights_used: number,
  emails_sent: number,
): { allowed: boolean; reason?: string } {
  const limits = PLAN_LIMITS[plan];
  if (
    limits.opportunities !== null &&
    opportunities_used >= limits.opportunities
  ) {
    return { allowed: false, reason: "Opportunity limit reached" };
  }
  if (limits.insights !== null && insights_used >= limits.insights) {
    return { allowed: false, reason: "Insight limit reached" };
  }
  if (limits.emails !== null && emails_sent >= limits.emails) {
    return { allowed: false, reason: "Email limit reached" };
  }
  return { allowed: true };
}