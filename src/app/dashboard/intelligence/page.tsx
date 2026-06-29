/**
 * Sprint 55: Dashboard Intelligence Page
 *
 * Displays market intelligence signals aggregated across 6 external sources
 * (Reddit, GitHub, Product Hunt, News, Google Trends, Jobs) for validated
 * opportunities.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTopIntelligenceSignalsAction, getIntelligenceStatsAction } from "@/actions/market-intelligence.actions";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { TrendingUp, BarChart3, Flame, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const [signalsResult, statsResult] = await Promise.all([
    getTopIntelligenceSignalsAction(50),
    getIntelligenceStatsAction(),
  ]);

  const signals = signalsResult.success ? signalsResult.data ?? [] : [];
  const stats = statsResult.success ? statsResult.data : null;

  // Fetch opportunity names + cluster names
  const oppIds = [...new Set(signals.map((s) => s.opportunity_id))];
  let opportunityMap = new Map<string, { title: string; clusterName: string | null }>();
  if (oppIds.length > 0) {
    const oppRepo = await OpportunitiesRepository.create();
    const opps = await oppRepo.findByIds(oppIds);
    opportunityMap = new Map(
      opps.map((o) => [o.id, { title: o.title, clusterName: null }]),
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-gray-600";
  };

  const getSignalBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-red-100 text-red-800">🔥 Massive</Badge>;
    if (score >= 70) return <Badge className="bg-green-100 text-green-800">Strong</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Weak</Badge>;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Market Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Aggregated external market signals for validated opportunities
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tracked Opportunities</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Intelligence Score</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats?.highestOverallScore ?? 0)}`}>
                {Math.round(stats?.highestOverallScore ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Intelligence</CardTitle>
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
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats?.averageConfidence ?? 0)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intelligence Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Market Signals</CardTitle>
          </CardHeader>
          <CardContent>
            {signals.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No market intelligence generated yet. Run the pipeline to aggregate signals for validated opportunities.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Opportunity</th>
                      <th className="text-left p-2">Overall</th>
                      <th className="text-left p-2">Reddit</th>
                      <th className="text-left p-2">GitHub</th>
                      <th className="text-left p-2">Product Hunt</th>
                      <th className="text-left p-2">News</th>
                      <th className="text-left p-2">Google Trends</th>
                      <th className="text-left p-2">Jobs</th>
                      <th className="text-left p-2">Confidence</th>
                      <th className="text-left p-2">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((row) => {
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
                          <td className="p-2">{row.reddit_score}</td>
                          <td className="p-2">{row.github_score}</td>
                          <td className="p-2">{row.product_hunt_score}</td>
                          <td className="p-2">{row.news_score}</td>
                          <td className="p-2">{row.google_trends_score}</td>
                          <td className="p-2">{row.jobs_score}</td>
                          <td className="p-2">{row.confidence}%</td>
                          <td className="p-2">{getSignalBadge(row.overall_score)}</td>
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