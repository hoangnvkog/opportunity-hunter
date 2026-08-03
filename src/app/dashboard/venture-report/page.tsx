/**
 * Sprint 57: Dashboard Venture Report Page
 * UI-4 polish — PageHeader, MetricCard, Badge variants, EmptyState, signal tones.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, scoreVariant, recommendationVariant } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { VentureReportRefreshButton } from "@/components/venture-report/venture-report-refresh-button";
import {
  getTopReportsAction,
  getReportStatisticsAction,
} from "@/actions/venture-report.actions";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { FileText, Star, TrendingUp, Rocket, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function confidenceTone(score: number): "hot" | "good" | "watch" | "cold" | "risk" | "info" | "default" {
  if (score >= 90) return "hot";
  if (score >= 75) return "good";
  if (score >= 60) return "watch";
  if (score >= 40) return "cold";
  return "risk";
}

export default async function VentureReportPage() {
  const [reportsResult, statsResult] = await Promise.all([
    getTopReportsAction(50),
    getReportStatisticsAction(),
  ]);

  const reports = reportsResult.success ? reportsResult.data ?? [] : [];
  const stats = statsResult.success ? statsResult.data : null;

  const oppIds = [...new Set(reports.map((r) => r.opportunity_id))];
  let opportunityMap = new Map<string, { title: string }>();
  if (oppIds.length > 0) {
    const oppRepo = await OpportunitiesRepository.create();
    const opps = await oppRepo.findByIds(oppIds);
    opportunityMap = new Map(opps.map((o) => [o.id, { title: o.title }]));
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Venture Research Reports"
          description="Báo cáo nghiên cứu AI cho cơ hội đầu tư (startup_score ≥ 80)."
          badge={<Badge variant="ai-soft">Sprint 57</Badge>}
          actions={<VentureReportRefreshButton />}
        />

        {/* KPI Cards — MetricCard */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Tổng báo cáo"
            value={stats?.total ?? 0}
            icon={<FileText className="h-4 w-4" />}
          />
          <MetricCard
            title="Confidence trung bình"
            value={`${Math.round(stats?.averageConfidence ?? 0)}%`}
            tone={confidenceTone(stats?.averageConfidence ?? 0)}
            icon={<MessageCircle className="h-4 w-4" />}
          />
          <MetricCard
            title="Investment Grade"
            value={stats?.investmentGradeCount ?? 0}
            tone="hot"
            icon={<Star className="h-4 w-4" />}
            change="confidence ≥ 80"
          />
          <MetricCard
            title="Strong Buy"
            value={stats?.strongBuyCount ?? 0}
            tone="hot"
            icon={<Rocket className="h-4 w-4" />}
            change="recommendation == STRONG BUY"
          />
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Venture Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-5 w-5" />}
                title="Chưa có venture report"
                description="Báo cáo được tạo cho cơ hội có startup_score overall_score ≥ 80."
              />
            ) : (
              <div className="space-y-4">
                {reports.map((row) => {
                  const opp = opportunityMap.get(row.opportunity_id);
                  return (
                    <div key={row.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium">
                            {opp?.title ?? "Unknown opportunity"}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {row.cluster_name ?? "—"} • v{row.report_version} •{" "}
                            {new Date(row.created_at).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant={recommendationVariant(row.recommendation)}>
                            {row.recommendation ?? "—"}
                          </Badge>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-muted-foreground">Confidence:</span>
                            <Badge variant={scoreVariant(row.confidence)}>
                              {row.confidence}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}