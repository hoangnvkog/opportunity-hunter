"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, X } from "lucide-react";
import type { Plan } from "@/types/subscription";

interface PricingClientProps {
  currentPlan: Plan;
}

const PLANS = [
  {
    id: "free" as Plan,
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For individuals exploring the platform.",
    features: [
      { label: "50 opportunities/month", included: true },
      { label: "20 AI insights/month", included: true },
      { label: "5 emails/month", included: true },
      { label: "Saved opportunities", included: true },
      { label: "Watchlists", included: true },
      { label: "Weekly digest", included: false },
      { label: "Email alerts", included: false },
      { label: "Team features", included: false },
    ],
    popular: false,
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For power users who need more.",
    features: [
      { label: "500 opportunities/month", included: true },
      { label: "200 AI insights/month", included: true },
      { label: "100 emails/month", included: true },
      { label: "Saved opportunities", included: true },
      { label: "Watchlists", included: true },
      { label: "Weekly digest", included: true },
      { label: "Email alerts", included: true },
      { label: "Team features", included: false },
    ],
    popular: true,
  },
  {
    id: "team" as Plan,
    name: "Team",
    price: "$99",
    period: "/month",
    description: "For teams with unlimited ambitions.",
    features: [
      { label: "Unlimited opportunities", included: true },
      { label: "Unlimited AI insights", included: true },
      { label: "Unlimited emails", included: true },
      { label: "Saved opportunities", included: true },
      { label: "Watchlists", included: true },
      { label: "Weekly digest", included: true },
      { label: "Email alerts", included: true },
      { label: "Team features", included: true },
    ],
    popular: false,
  },
];

function FeatureItem({ feature }: { feature: (typeof PLANS)[number]["features"][number] }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {feature.included ? (
        <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
      ) : (
        <X className="h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
      )}
      <span className={feature.included ? "" : "text-muted-foreground/60"}>
        {feature.label}
      </span>
    </li>
  );
}

export default function PricingClient({ currentPlan }: PricingClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<Plan | null>(null);

  async function handleSelect(planId: Plan) {
    if (planId === "free") return;
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const json = await res.json();
      if (json.url) {
        router.push(json.url);
      } else {
        alert(json.error ?? "Failed to start checkout");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-2 text-muted-foreground">
          Choose the plan that fits your needs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <Card
              key={plan.id}
              className={
                plan.popular
                  ? "relative border-violet-500 shadow-lg ring-1 ring-violet-500"
                  : "relative"
              }
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <FeatureItem key={f.label} feature={f} />
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                  className="w-full"
                  disabled={isCurrent || loading !== null}
                  onClick={() => handleSelect(plan.id)}
                >
                  {isCurrent
                    ? "Current Plan"
                    : plan.id === "free"
                      ? "Get Started"
                      : currentPlan !== "free"
                        ? `Upgrade to ${plan.name}`
                        : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}