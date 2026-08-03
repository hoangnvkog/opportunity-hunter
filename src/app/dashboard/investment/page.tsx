/**
 * Sprint 56: Dashboard Investment Page
 * UI-4 polish — PageHeader, MetricCard, Badge variants, EmptyState.
 */

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, scoreVariant, recommendationVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getTopScoresAction,
  getScoreStatisticsAction,
} from "@/actions/startup-score.actions";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import {
  Target,
  Star,
  TrendingUp,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const DIMENSION_COLUMNS: Array<{
  key: keyof import("@/types/startup-score").StartupScoreCardData;
  label: string;
}> = [
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

  const highest = Math.round(stats?.highestOverallScore ?? 0);
  const average = Math.round(stats?.averageOverallScore ?? 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Investment Scoring"
          description="VC-style due diligence scores — 7 chiều, triple-gate pipeline."
          badge={<Badge variant="ai-soft">Sprint 56</Badge>}
          actions={
            <Link
              href="/dashboard/validated"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Xem validated
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Scored Opportunities"
            value={stats?.total ?? 0}
            icon={<Target className="h-4 w-4" />}
          />
          <MetricCard
            title="Highest Score"
            value={highest}
            tone={highest >= 90 ? "hot" : highest >= 70 ? "ai" : "info"}
            icon={<Star className="h-4 w-4" />}
          />
          <MetricCard
            title="Average Score"
            value={average}
            tone={average >= 75 ? "hot" : average >= 60 ? "info" : "default"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Investment Grade"
            value={stats?.investmentGradeCount ?? 0}
            tone="hot"
            icon={<BarChart3 className="h-4 w-4" />}
            change="score ≥ 90"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Investment-Grade Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {scores.length === 0 ? (
              <EmptyState
                icon={<Target className="h-5 w-5" />}
                title="Chưa có investment score"
                description="Chạy pipeline để score các validated opportunities."
                action={{ label: "Mở Pipeline", href: "/admin/pipeline" }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Opportunity</th>
                      <th className="px-3 py-2 font-medium">Overall</th>
                      {DIMENSION_COLUMNS.map((d) => (
                        <th key={d.key} className="px-3 py-2 font-medium">
                          {d.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 font-medium">Confidence</th>
                      <th className="px-3 py-2 font-medium">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((row) => {
                      const opp = opportunityMap.get(row.opportunity_id);
                      return (
                        <tr
                          key={row.id}
                          className="border-b transition-colors hover:bg-secondary/40"
                        >
                          <td className="px-3 py-2 font-medium">
                            {opp ? (
                              <Link
                                href={`/opportunities/${row.opportunity_id}`}
                                className="hover:underline"
                              >
                                {opp.title}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={scoreVariant(row.overall_score)}>
                              {row.overall_score}
                            </Badge>
                          </td>
                          {DIMENSION_COLUMNS.map((d) => {
                            const v = row[d.key] as number;
                            return (
                              <td
                                key={d.key}
                                className="px-3 py-2 tabular-nums"
                              >
                                {typeof v === "number" ? (
                                  <span
                                    className={
                                      v >= 80
                                        ? "text-signal-hot-foreground"
                                        : v >= 60
                                          ? "text-signal-info-foreground"
                                          : "text-muted-foreground"
                                    }
                                  >
                                    {v}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 tabular-nums">
                            {row.confidence}%
                          </td>
                          <td className="px-3 py-2">
                            {row.recommendation ? (
                              <Badge variant={recommendationVariant(row.recommendation)}>
                                {row.recommendation}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
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
