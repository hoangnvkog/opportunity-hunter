"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlanBadge } from "@/components/billing/PlanBadge";
import type { Plan } from "@/types/subscription";

interface BillingClientProps {
  subscription: {
    plan: Plan;
    status: string;
    current_period_end: string | null;
    stripe_subscription_id: string | null;
  } | null;
  digests: Array<{
    id: string;
    week_start: string;
    week_end: string;
    status: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  canceled: "bg-rose-100 text-rose-800",
  past_due: "bg-amber-100 text-amber-800",
  trialing: "bg-blue-100 text-blue-800",
  incomplete: "bg-slate-100 text-slate-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export function BillingClient({ subscription, digests }: BillingClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const plan = subscription?.plan ?? "free";
  const status = subscription?.status ?? "active";
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;
  const hasStripe = !!subscription?.stripe_subscription_id;

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) router.push(json.url);
      else alert(json.error ?? "Failed to open billing portal");
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel your subscription? You will lose access to premium features.")) {
      return;
    }
    setLoading("cancel");
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        router.refresh();
      } else {
        alert(json.error ?? "Failed to cancel");
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleResume() {
    if (!window.confirm("Resume your subscription?")) return;
    setLoading("resume");
    try {
      const res = await fetch("/api/stripe/resume", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        router.refresh();
      } else {
        alert(json.error ?? "Failed to resume");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} className="text-sm" />
            <StatusBadge status={status} />
          </div>
          {periodEnd && (
            <p className="text-sm text-muted-foreground">
              Renews: {periodEnd}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {plan !== "free" && (
              <Button variant="destructive" size="sm" onClick={handleCancel} disabled={loading !== null}>
                {loading === "cancel" ? "Canceling…" : "Cancel subscription"}
              </Button>
            )}
            {status === "canceled" && plan !== "free" && (
              <Button variant="default" size="sm" onClick={handleResume} disabled={loading !== null}>
                {loading === "resume" ? "Resuming…" : "Resume subscription"}
              </Button>
            )}
            {hasStripe && (
              <Button variant="outline" size="sm" onClick={handlePortal} disabled={loading !== null}>
                {loading === "portal" ? "Loading…" : "Manage billing"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Digest history */}
      <Card>
        <CardHeader>
          <CardTitle>Digest History</CardTitle>
          <CardDescription>Recent billing events (as digest history).</CardDescription>
        </CardHeader>
        <CardContent>
          {digests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No digests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2">Week</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {digests.map((digest) => (
                    <tr key={digest.id}>
                      <td className="py-2">
                        {digest.week_start} → {digest.week_end}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={digest.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}