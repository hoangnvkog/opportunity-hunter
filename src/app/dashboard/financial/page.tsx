/**
 * Sprint 64: Financial Dashboard
 * UI-4 polish — AppLayout, MetricCard, EmptyState, signal tones.
 */

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getDashboardStats,
  listModels,
} from "@/services/financial/financial.service";
import {
  Coins,
  Clock,
  Flame,
  TrendingUp,
  Target,
  BarChart3,
  Rocket,
  ArrowRight,
} from "lucide-react";

function formatCurrencyValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function runwayTone(months: number): "hot" | "watch" | "risk" | "default" {
  if (months >= 18) return "hot";
  if (months >= 12) return "default";
  if (months >= 6) return "watch";
  return "risk";
}

function ltvCacTone(ratio: number): "hot" | "watch" | "risk" | "default" {
  if (ratio >= 3) return "hot";
  if (ratio >= 1) return "default";
  return "risk";
}

export const dynamic = "force-dynamic";

export default async function FinancialDashboardPage() {
  const [stats, models] = await Promise.all([
    getDashboardStats(),
    listModels({ limit: 50 }),
  ]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Financial Projections"
          description="Mô hình tài chính — Projected ARR, Runway, Burn Rate, Break-even."
          badge={<Badge variant="ai-soft">Sprint 64</Badge>}
          actions={
            <Link
              href="/dashboard/venture"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Mở Venture Studio
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard
            title="Models"
            value={stats.totalModels}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <MetricCard
            title="Projected ARR"
            value={formatCurrencyValue(stats.projectedARR)}
            tone="hot"
            icon={<Coins className="h-4 w-4" />}
          />
          <MetricCard
            title="Runway"
            value={`${stats.runwayMonths.toFixed(0)} mo`}
            tone={runwayTone(stats.runwayMonths)}
            icon={<Clock className="h-4 w-4" />}
          />
          <MetricCard
            title="Burn Rate"
            value={formatCurrencyValue(stats.burnRate)}
            change="per month"
            tone="watch"
            icon={<Flame className="h-4 w-4" />}
          />
          <MetricCard
            title="Break Even"
            value={`Mo ${stats.breakEvenMonth}`}
            tone="info"
            icon={<Target className="h-4 w-4" />}
          />
          <MetricCard
            title="LTV/CAC"
            value={`${stats.ltvCacRatio.toFixed(1)}x`}
            tone={ltvCacTone(stats.ltvCacRatio)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        <MetricCard
          title="Projected Profit (Year 5)"
          value={formatCurrencyValue(stats.projectedProfit)}
          tone={stats.projectedProfit >= 0 ? "hot" : "risk"}
          icon={<Rocket className="h-4 w-4" />}
          className="max-w-md"
        />

        <Card>
          <CardHeader>
            <CardTitle>Financial Models</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {models.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-5 w-5" />}
                title="Chưa có financial model"
                description="Generate model từ Venture Studio."
                action={{ label: "Mở Venture Studio", href: "/dashboard/venture" }}
              />
            ) : (
              <div className="divide-y">
                {models.map((m) => (
                  <Link
                    key={m.id}
                    href={`/dashboard/financial/${m.id}`}
                    className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/40"
                  >
                    <div>
                      <p className="font-medium">{m.currency} Model</p>
                      <p className="text-xs text-muted-foreground">
                        {m.projection_years}-year projection · Created{" "}
                        {new Date(m.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                      Mở
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
