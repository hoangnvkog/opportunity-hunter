/**
 * Sprint 54: Admin Forecasts Page
 *
 * Admin page to view, regenerate, and delete forecasts.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OpportunityForecastsRepository } from "@/lib/db/repositories/opportunity-forecasts.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { RegenerateButton } from "./RegenerateButton";

export const dynamic = "force-dynamic";

export default async function AdminForecastsPage() {
  const [forecastRepo, oppRepo] = await Promise.all([
    OpportunityForecastsRepository.create(),
    OpportunitiesRepository.create(),
  ]);

  const forecasts = await forecastRepo.list({ limit: 100 });
  const total = await forecastRepo.count();
  const avgScore = await forecastRepo.averageForecastScore();
  const oppIds = [...new Set(forecasts.map((f) => f.opportunity_id))];
  const opportunities = await oppRepo.findByIds(oppIds);
  const opportunityMap = new Map(opportunities.map((o) => [o.id, o.title]));

  // Group forecast by opportunity (for summary)
  const byOpportunity = forecasts.reduce<Record<string, { count: number; avgScore: number }>>(
    (acc, f) => {
      const oppId = f.opportunity_id;
      if (!acc[oppId]) {
        acc[oppId] = { count: 0, avgScore: 0 };
      }
      acc[oppId].count++;
      acc[oppId].avgScore += f.forecast_score;
      return acc;
    },
    {},
  );

  // Calculate average score per opportunity
  for (const [, data] of Object.entries(byOpportunity)) {
    data.avgScore = Math.round((data.avgScore / data.count) * 100) / 100;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Forecasts</h1>
        <p className="text-muted-foreground mt-1">
          {total} total forecast records
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgScore)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Opportunities with Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oppIds.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Forecasts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Forecasts</CardTitle>
        </CardHeader>
        <CardContent>
          {forecasts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No forecasts generated yet.</p>
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
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((forecast) => (
                    <tr key={forecast.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium truncate max-w-xs">
                        {opportunityMap.get(forecast.opportunity_id) ?? "Unknown"}
                      </td>
                      <td className="p-2">
                        <span className="font-bold">{forecast.forecast_score}</span>
                      </td>
                      <td className="p-2">{forecast.growth_probability}%</td>
                      <td className="p-2">{forecast.confidence}%</td>
                      <td className="p-2">{forecast.momentum}</td>
                      <td className="p-2 text-muted-foreground max-w-sm truncate">
                        {forecast.prediction_summary}
                      </td>
                      <td className="p-2 space-x-2">
                        <RegenerateButton opportunityId={forecast.opportunity_id} />
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