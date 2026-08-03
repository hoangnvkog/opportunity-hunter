/**
 * Sprint 55: Dashboard Intelligence Page
 * UI-4 polish — PageHeader, MetricCard, Badge variants, EmptyState, signal tones.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, scoreVariant, signalVariant } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getTopIntelligenceSignalsAction, getIntelligenceStatsAction } from "@/actions/market-intelligence.actions";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { TrendingUp, BarChart3, Flame, MessageCircle, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

function intelligenceTone(score: number): "hot" | "good" | "watch" | "cold" | "risk" | "default" {
  if (score >= 85) return "hot";
  if (score >= 70) return "good";
  if (score >= 50) return "watch";
  if (score >= 30) return "cold";
  return "risk";
}

function signalLabel(score: number): string {
  if (score >= 90) return "🔥 Massive";
  if (score >= 70) return "Strong";
  if (score >= 40) return "Moderate";
  return "Weak";
}

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

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Market Intelligence"
          description="Tín hiệu thị trường tổng hợp từ 6 nguồn bên ngoài cho cơ hội đã validate."
          badge={<Badge variant="ai-soft">Sprint 55</Badge>}
        />

        {/* KPI Cards — MetricCard */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Cơ hội theo dõi"
            value={stats?.total ?? 0}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <MetricCard
            title="Intelligence Score cao nhất"
            value={Math.round(stats?.highestOverallScore ?? 0)}
            tone={intelligenceTone(stats?.highestOverallScore ?? 0)}
            icon={<Flame className="h-4 w-4" />}
          />
          <MetricCard
            title="Intelligence trung bình"
            value={Math.round(stats?.averageOverallScore ?? 0)}
            tone={intelligenceTone(stats?.averageOverallScore ?? 0)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Confidence trung bình"
            value={`${Math.round(stats?.averageConfidence ?? 0)}%`}
            tone={stats?.averageConfidence ?? 0 >= 80 ? "hot" : stats?.averageConfidence ?? 0 >= 60 ? "good" : "info"}
            icon={<MessageCircle className="h-4 w-4" />}
          />
        </div>

        {/* Intelligence Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Top Market Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signals.length === 0 ? (
              <EmptyState
                icon={<Zap className="h-5 w-5" />}
                title="Chưa có market intelligence"
                description="Chạy pipeline để tổng hợp signals cho các cơ hội đã validated."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Cơ hội</th>
                      <th className="px-3 py-2 font-medium">Overall</th>
                      <th className="px-3 py-2 font-medium">Reddit</th>
                      <th className="px-3 py-2 font-medium">GitHub</th>
                      <th className="px-3 py-2 font-medium">Product Hunt</th>
                      <th className="px-3 py-2 font-medium">News</th>
                      <th className="px-3 py-2 font-medium">Google Trends</th>
                      <th className="px-3 py-2 font-medium">Jobs</th>
                      <th className="px-3 py-2 font-medium">Confidence</th>
                      <th className="px-3 py-2 font-medium">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((row) => {
                      const opp = opportunityMap.get(row.opportunity_id);
                      return (
                        <tr key={row.id} className="border-b last:border-0 hover:bg-secondary/40">
                          <td className="px-3 py-2 font-medium">
                            {opp?.title ?? "Unknown"}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={scoreVariant(row.overall_score)}>
                              {row.overall_score}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 tabular-nums">{row.reddit_score}</td>
                          <td className="px-3 py-2 tabular-nums">{row.github_score}</td>
                          <td className="px-3 py-2 tabular-nums">{row.product_hunt_score}</td>
                          <td className="px-3 py-2 tabular-nums">{row.news_score}</td>
                          <td className="px-3 py-2 tabular-nums">{row.google_trends_score}</td>
                          <td className="px-3 py-2 tabular-nums">{row.jobs_score}</td>
                          <td className="px-3 py-2 tabular-nums">{row.confidence}%</td>
                          <td className="px-3 py-2">
                            <Badge variant={signalVariant(row.overall_score)}>
                              {signalLabel(row.overall_score)}
                            </Badge>
                          </td>
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