/**
 * Sprint 57: Admin Venture Report Page
 *
 * Admin view for venture research reports:
 * - Confidence distribution
 * - Recommendation breakdown
 * - Top venture reports table
 * - Report history (last 30 days)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { VentureReportsRepository } from "@/lib/db/repositories/venture-reports.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";

export const dynamic = "force-dynamic";

export default async function AdminVentureReportPage() {
  const [reportsRepo, oppRepo] = await Promise.all([
    VentureReportsRepository.create(),
    OpportunitiesRepository.create(),
  ]);

  const [
    reportCards,
    stats,
    confidenceDistribution,
    recommendationBreakdown,
    history,
  ] = await Promise.all([
    reportsRepo.listCards({ limit: 100 }),
    reportsRepo.getStats(),
    reportsRepo.getConfidenceDistribution(),
    reportsRepo.getRecommendationBreakdown(),
    reportsRepo.getHistory(30),
  ]);

  const oppIds = [...new Set(reportCards.map((r) => r.opportunity_id))];
  const opportunities = await oppRepo.findByIds(oppIds);
  const opportunityMap = new Map(opportunities.map((o) => [o.id, o.title]));

  const maxConfidenceBucket = Math.max(1, ...confidenceDistribution.map((d) => d.count));
  const maxHistoryBucket = Math.max(1, ...history.map((h) => h.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Venture Research Reports</h1>
        <p className="text-muted-foreground mt-1">
          {stats.total} reports generated · avg confidence {Math.round(stats.averageConfidence)}% ·{" "}
          {stats.investmentGradeCount} investment-grade · {stats.strongBuyCount} strong buy
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageConfidence)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Investment Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {stats.investmentGradeCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">confidence ≥ 80</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Strong Buy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {stats.strongBuyCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <p className="text-muted-foreground text-sm">No records yet.</p>
          ) : (
            <div className="space-y-2">
              {confidenceDistribution.map((bucket) => (
                <div key={bucket.bucket} className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium">{bucket.bucket}</div>
                  <div className="flex-1 bg-muted rounded h-6 relative">
                    <div
                      className="bg-green-500 h-full rounded"
                      style={{
                        width: `${(bucket.count / maxConfidenceBucket) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-muted-foreground">
                    {bucket.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendation Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendationBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {recommendationBreakdown.map((row) => (
                <div key={row.recommendation} className="flex items-center gap-3">
                  <div className="w-40 text-sm font-medium">{row.recommendation}</div>
                  <Badge className="bg-muted text-foreground">
                    {row.count}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Report Generation History (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">No history yet.</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 14).map((row) => (
                <div key={row.date} className="flex items-center gap-3">
                  <div className="w-28 text-sm font-medium">{row.date}</div>
                  <div className="flex-1 bg-muted rounded h-5 relative">
                    <div
                      className="bg-blue-500 h-full rounded"
                      style={{ width: `${(row.count / maxHistoryBucket) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm text-muted-foreground">
                    {row.count} ({Math.round(row.avgConfidence)}%)
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Venture Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Top Venture Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reportCards.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No venture reports generated yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Opportunity</th>
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Confidence</th>
                    <th className="text-left p-2">Recommendation</th>
                    <th className="text-left p-2">v</th>
                    <th className="text-left p-2">Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCards.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium truncate max-w-xs">
                        {opportunityMap.get(row.opportunity_id) ?? "Unknown"}
                      </td>
                      <td className="p-2 truncate max-w-xs">{row.cluster_name ?? "—"}</td>
                      <td className="p-2 font-bold">{row.confidence}%</td>
                      <td className="p-2">{row.recommendation ?? "—"}</td>
                      <td className="p-2">{row.report_version}</td>
                      <td className="p-2 text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString()}
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