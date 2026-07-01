/**
 * Sprint 56: Dashboard Investment Page
 *
 * Displays VC-style investment scores for opportunities that passed the
 * 3-gate pipeline (validation >= 70, forecast >= 70, market_intelligence >= 70).
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTopScoresAction, getScoreStatisticsAction } from "@/actions/startup-score.actions";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { TrendingUp, Star, BarChart3, Target } from "lucide-react";

export const dynamic = "force-dynamic";

const DIMENSION_COLUMNS: Array<{ key: keyof import("@/types/startup-score").StartupScoreCardData; label: string }> = [
  { key: "tam_score", label: "TAM" },
  { key: "market_timing_score", label: "Timing" },
  { key: "competition_score", label: "Competition" },
  { key: "moat_score", label: "Moat" },
  { key: "distribution_score", label: "Distribution" },
  { key: "execution_score", label: "Execution" },
  { key: "capital_efficiency_score", label: "Capital" },
];

export default async function InvestmentPage() {
  const [scoresResult, statsResult] = await Promise.all([
    getTopScoresAction(50),
    getScoreStatisticsAction(),
  ]);

  const scores = scoresResult.success ? scoresResult.data ?? [] : [];
  const stats = statsResult.success ? statsResult.data : null;

  const oppIds = [...new Set(scores.map((s) => s.opportunity_id))];
  let opportunityMap = new Map<string, { title: string }>();
  if (oppIds.length > 0) {
    const oppRepo = await OpportunitiesRepository.create();
    const opps = await oppRepo.findByIds(oppIds);
    opportunityMap = new Map(opps.map((o) => [o.id, { title: o.title }]));
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-700";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-gray-600";
  };

  const getRecommendationBadge = (rec: string | null) => {
    if (!rec) return <Badge className="bg-gray-100 text-gray-800">—</Badge>;
    if (rec.toLowerCase().includes("strong"))
      return <Badge className="bg-green-100 text-green-800">⭐ {rec}</Badge>;
    if (rec.toLowerCase().includes("watch"))
      return <Badge className="bg-yellow-100 text-yellow-800">{rec}</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{rec}</Badge>;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investment Scoring</h1>
          <p className="text-muted-foreground mt-1">
            VC-style due diligence scores for validated opportunities
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scored Opportunities</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Investment Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats?.highestOverallScore ?? 0)}`}>
                {Math.round(stats?.highestOverallScore ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Investment Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats?.averageOverallScore ?? 0)}`}>
                {Math.round(stats?.averageOverallScore ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investment Grade Opportunities</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {stats?.investmentGradeCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">overall_score ≥ 90</p>
            </CardContent>
          </Card>
        </div>

        {/* Investment Table */}
        <Card>
          <CardHeader>
            <CardTitle>Investment-Grade Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {scores.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No investment scores generated yet. Run the pipeline to score validated opportunities.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Opportunity</th>
                      <th className="text-left p-2">Overall</th>
                      {DIMENSION_COLUMNS.map((d) => (
                        <th key={d.key} className="text-left p-2">{d.label}</th>
                      ))}
                      <th className="text-left p-2">Confidence</th>
                      <th className="text-left p-2">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((row) => {
                      const opp = opportunityMap.get(row.opportunity_id);
                      return (
                        <tr key={row.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">
                            {opp?.title ?? "Unknown"}
                          </td>
                          <td className="p-2">
                            <span className={`font-bold ${getScoreColor(row.overall_score)}`}>
                              {row.overall_score}
                            </span>
                          </td>
                          {DIMENSION_COLUMNS.map((d) => (
                            <td key={d.key} className="p-2">
                              {row[d.key] as number}
                            </td>
                          ))}
                          <td className="p-2">{row.confidence}%</td>
                          <td className="p-2">{getRecommendationBadge(row.recommendation)}</td>
                        </tr>
                      );
                    })}
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