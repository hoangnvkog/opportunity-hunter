/**
 * Sprint 57: Dashboard Venture Report Page
 *
 * Displays AI-generated venture research reports for investment-grade
 * opportunities (startup_score overall_score >= 80).
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { VentureReportRefreshButton } from "@/components/venture-report/venture-report-refresh-button";
import {
  getTopReportsAction,
  getReportStatisticsAction,
} from "@/actions/venture-report.actions";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { FileText, Star, TrendingUp, Rocket } from "lucide-react";

export const dynamic = "force-dynamic";

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-700";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  return "text-gray-600";
}

function getRecommendationBadge(rec: string | null) {
  if (!rec) return <Badge className="bg-gray-100 text-gray-800">—</Badge>;
  if (rec === "STRONG BUY")
    return <Badge className="bg-green-100 text-green-800">🚀 {rec}</Badge>;
  if (rec === "BUY")
    return <Badge className="bg-blue-100 text-blue-800">{rec}</Badge>;
  if (rec === "HOLD")
    return <Badge className="bg-yellow-100 text-yellow-800">{rec}</Badge>;
  return <Badge className="bg-gray-100 text-gray-800">{rec}</Badge>;
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Venture Research Reports</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated investment-grade research reports for top opportunities
            </p>
          </div>
          <VentureReportRefreshButton />
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats?.averageConfidence ?? 0)}`}>
                {Math.round(stats?.averageConfidence ?? 0)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investment Grade</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {stats?.investmentGradeCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">confidence ≥ 80</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Strong Buy</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {stats?.strongBuyCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">recommendation == STRONG BUY</p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Venture Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No venture reports generated yet. Reports are generated for opportunities with
                startup_score overall_score ≥ 80.
              </p>
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
                            {new Date(row.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          {getRecommendationBadge(row.recommendation)}
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-muted-foreground">Confidence:</span>
                            <span className={`text-sm font-bold ${getScoreColor(row.confidence)}`}>
                              {row.confidence}%
                            </span>
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