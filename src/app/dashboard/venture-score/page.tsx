/**
 * /dashboard/venture-score — Venture Score overview
 * UI-4 polish — AppLayout, PageHeader, MetricCard, Badge variants, EmptyState.
 */
export const dynamic = "force-dynamic";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, recommendationVariant, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Star, TrendingUp, BarChart3 } from "lucide-react";
import {
  getVentureScoreDashboardStats,
  listLatestScores,
  listTopScores,
} from "@/services/venture-score/venture-score.service";

export default async function VentureScoreDashboardPage() {
  const [stats, latestScores, topScores] = await Promise.all([
    getVentureScoreDashboardStats(),
    listLatestScores(20),
    listTopScores(10),
  ]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Venture Score Engine"
          description="Điểm số đầu tư xác định cho tất cả mô-đun phân tích venture."
          badge={<Badge variant="ai-soft">Sprint 56</Badge>}
        />

        {/* KPI cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Tổng scores"
            value={stats.total}
            icon={<Target className="h-4 w-4" />}
          />
          <MetricCard
            title="Score trung bình"
            value={stats.average.toFixed(1)}
            tone={stats.average >= 85 ? "hot" : stats.average >= 70 ? "ai" : stats.average >= 50 ? "info" : "default"}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <MetricCard
            title="Cơ hội AAA"
            value={stats.gradeDistribution.AAA ?? 0}
            tone="hot"
            icon={<Star className="h-4 w-4" />}
          />
          <MetricCard
            title="Top ROI Score"
            value={stats.topByROI}
            tone="info"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Phân bố Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <Badge variant={gradeBadgeVariant(grade)} className="w-full">
                    {grade}
                  </Badge>
                  <p className="text-lg font-bold mt-1">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Venture Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topScores.length === 0 ? (
              <EmptyState
                icon={<Target className="h-5 w-5" />}
                title="Chưa có score"
                description="Chạy pipeline để tính venture scores cho opportunities."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Score</th>
                      <th className="pb-2 font-medium">Grade</th>
                      <th className="pb-2 font-medium">Recommendation</th>
                      <th className="pb-2 font-medium">Confidence</th>
                      <th className="pb-2 font-medium">Risk</th>
                      <th className="pb-2 font-medium">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topScores.map((s) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/40">
                        <td className="py-2 font-semibold">{Number(s.overall_score).toFixed(1)}</td>
                        <td className="py-2">
                          <Badge variant={gradeBadgeVariant(s.investment_grade)}>
                            {s.investment_grade}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Badge variant={recommendationVariant(s.recommendation)}>
                            {s.recommendation}
                          </Badge>
                        </td>
                        <td className="py-2">{Number(s.confidence_score).toFixed(1)}</td>
                        <td className="py-2">{Number(s.risk_score).toFixed(1)}</td>
                        <td className="py-2">{Number(s.roi_score).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Scores mới nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestScores.length === 0 ? (
              <EmptyState
                icon={<Target className="h-5 w-5" />}
                title="Chưa có score"
                description="Chưa có venture score nào được tính toán."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Cơ hội</th>
                      <th className="pb-2 font-medium">Score</th>
                      <th className="pb-2 font-medium">Grade</th>
                      <th className="pb-2 font-medium">Rec</th>
                      <th className="pb-2 font-medium">Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestScores.map((s) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/40">
                        <td className="py-2 truncate max-w-[200px]">{s.opportunity_title}</td>
                        <td className="py-2 font-semibold">{s.overall_score.toFixed(1)}</td>
                        <td className="py-2">
                          <Badge variant={gradeBadgeVariant(s.investment_grade)}>
                            {s.investment_grade}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Badge variant={recommendationVariant(s.recommendation)}>
                            {s.recommendation}
                          </Badge>
                        </td>
                        <td className="py-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("vi-VN")}</td>
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

function gradeBadgeVariant(grade: string): VariantProps<typeof badgeVariants>["variant"] {
  switch (grade) {
    case "AAA":
      return "hot";
    case "AA":
      return "good";
    case "A":
      return "info";
    case "BBB":
      return "watch";
    case "BB":
      return "cold";
    case "B":
      return "risk";
    case "Reject":
      return "risk";
    default:
      return "default";
  }
}