/**
 * Sprint 54: Dashboard Forecasts Page
 *
 * Displays forecasted opportunities sorted by forecast score.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTopForecastsAction, getForecastStatsAction } from "@/actions/forecast.actions";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { TrendingUp, BarChart3, Zap, Target } from "lucide-react";

export const dynamic = "force-dynamic";

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

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-gray-600";
  };

  const getMomentumBadge = (momentum: number) => {
    if (momentum >= 80) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (momentum >= 60) return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Opportunity Forecasts</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered predictions for opportunity growth
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecasted Winners</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Forecast Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats?.topForecastScore ?? 0)}`}>
                {Math.round(stats?.topForecastScore ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Forecast Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats?.averageForecastScore ?? 0)}`}>
                {Math.round(stats?.averageForecastScore ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Growth Probability</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats?.averageGrowthProbability ?? 0)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forecasts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Forecasted Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {forecasts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No forecasts generated yet. Run the pipeline to generate forecasts for validated opportunities.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Opportunity</th>
                      <th className="text-left p-2">Forecast Score</th>
                      <th className="text-left p-2">Growth Probability</th>
                      <th className="text-left p-2">Confidence</th>
                      <th className="text-left p-2">Momentum</th>
                      <th className="text-left p-2">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((forecast) => (
                      <tr key={forecast.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">
                          {opportunityMap.get(forecast.opportunity_id) ?? "Unknown"}
                        </td>
                        <td className="p-2">
                          <span className={`font-bold ${getScoreColor(forecast.forecast_score)}`}>
                            {forecast.forecast_score}
                          </span>
                        </td>
                        <td className="p-2">{forecast.growth_probability}%</td>
                        <td className="p-2">{forecast.confidence}%</td>
                        <td className="p-2">{getMomentumBadge(forecast.momentum)}</td>
                        <td className="p-2 text-muted-foreground max-w-xs truncate">
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
