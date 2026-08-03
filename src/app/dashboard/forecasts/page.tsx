/**
 * Sprint 54: Dashboard Forecasts Page
 * UI-4 polish — PageHeader, MetricCard, Badge variants, EmptyState.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, scoreVariant } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getTopForecastsAction, getForecastStatsAction } from "@/actions/forecast.actions";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { TrendingUp, BarChart3, Zap, Target } from "lucide-react";

export const dynamic = "force-dynamic";

function momentumVariant(m: number): "hot" | "info" | "default" {
  if (m >= 80) return "hot";
  if (m >= 60) return "info";
  return "default";
}

function momentumLabel(m: number): string {
  if (m >= 80) return "Cao";
  if (m >= 60) return "Trung bình";
  return "Thấp";
}

export default async function ForecastsPage() {
  const [forecastsResult, statsResult] = await Promise.all([
    getTopForecastsAction(50),
    getForecastStatsAction(),
  ]);

  const forecasts = forecastsResult.success ? forecastsResult.data ?? [] : [];
  const stats = statsResult.success ? statsResult.data : null;

  // Fetch opportunity names
  const oppIds = [...new Set(forecasts.map((f) => f.opportunity_id))];
  let opportunityMap = new Map<string, string>();
  if (oppIds.length > 0) {
    const oppRepo = await OpportunitiesRepository.create();
    const opps = await oppRepo.findByIds(oppIds);
    opportunityMap = new Map(opps.map((o) => [o.id, o.title]));
  }

  const top = Math.round(stats?.topForecastScore ?? 0);
  const avg = Math.round(stats?.averageForecastScore ?? 0);
  const avgGrowth = Math.round(stats?.averageGrowthProbability ?? 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Opportunity Forecasts"
          description="Dự đoán tăng trưởng bằng AI — momentum, growth probability, confidence."
          badge={<Badge variant="ai-soft">Sprint 54</Badge>}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Forecasted Winners"
            value={stats?.total ?? 0}
            icon={<Zap className="h-4 w-4" />}
          />
          <MetricCard
            title="Highest Score"
            value={top}
            tone={top >= 85 ? "hot" : top >= 70 ? "ai" : "info"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg Score"
            value={avg}
            tone={avg >= 75 ? "hot" : avg >= 60 ? "info" : "default"}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg Growth Probability"
            value={avgGrowth}
            suffix="%"
            tone={avgGrowth >= 70 ? "hot" : avgGrowth >= 50 ? "info" : "default"}
            icon={<Target className="h-4 w-4" />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Forecasted Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {forecasts.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-5 w-5" />}
                title="Chưa có forecast"
                description="Chạy pipeline để generate forecasts cho validated opportunities."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Opportunity</th>
                      <th className="px-3 py-2 font-medium">Forecast Score</th>
                      <th className="px-3 py-2 font-medium">Growth Probability</th>
                      <th className="px-3 py-2 font-medium">Confidence</th>
                      <th className="px-3 py-2 font-medium">Momentum</th>
                      <th className="px-3 py-2 font-medium">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((forecast) => (
                      <tr
                        key={forecast.id}
                        className="border-b transition-colors hover:bg-secondary/40"
                      >
                        <td className="px-3 py-2 font-medium">
                          {opportunityMap.get(forecast.opportunity_id) ?? "Unknown"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={scoreVariant(forecast.forecast_score)}>
                            {forecast.forecast_score}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {forecast.growth_probability}%
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {forecast.confidence}%
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={momentumVariant(forecast.momentum)}>
                            {momentumLabel(forecast.momentum)}
                          </Badge>
                        </td>
                        <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">
                          {forecast.prediction_summary}
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
    </AppLayout>
  );
}
