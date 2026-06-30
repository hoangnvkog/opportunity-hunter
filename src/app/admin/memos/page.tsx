/**
 * Sprint 58: Admin Investment Memo Page
 *
 * Admin view for investment memos:
 * - Generation metrics (count, avg confidence, generation time estimate)
 * - Recommendation breakdown
 * - Investment decision breakdown
 * - Confidence distribution
 * - Memo generation history (last 30 days)
 * - Top memos table
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InvestmentMemosRepository } from "@/lib/db/repositories/investment-memos.repository";

export const dynamic = "force-dynamic";

export default async function AdminInvestmentMemoPage() {
  const repo = await InvestmentMemosRepository.create();

  const [
    memoCards,
    stats,
    confidenceDistribution,
    recommendationBreakdown,
    decisionBreakdown,
    history,
    averageConfidence,
    strongBuyCount,
    latestDate,
    totalCount,
  ] = await Promise.all([
    repo.listCards({ limit: 100 }),
    repo.getStats(),
    repo.getConfidenceDistribution(),
    repo.getRecommendationBreakdown(),
    repo.getInvestmentDecisionBreakdown(),
    repo.getHistory(30),
    repo.averageConfidence(),
    repo.strongBuyCount(),
    repo.latestMemoDate(),
    repo.count(),
  ]);

  const maxConfidenceBucket = Math.max(1, ...confidenceDistribution.map((d) => d.count));
  const maxHistoryBucket = Math.max(1, ...history.map((h) => h.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investment Memos</h1>
        <p className="text-muted-foreground mt-1">
          {stats.total} memos generated · avg confidence {Math.round(stats.averageConfidence)}% ·{" "}
          {stats.strongBuyCount} strong buy · {stats.investorReadyCount} investor-ready
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Memos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageConfidence)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Strong Buy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{strongBuyCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Memo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold">
              {latestDate ? new Date(latestDate).toLocaleDateString() : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestDate ? new Date(latestDate).toLocaleTimeString() : "no data"}
            </p>
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
                  <Badge className="bg-muted text-foreground">{row.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Decision Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Decision Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {decisionBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {decisionBreakdown.slice(0, 8).map((row) => (
                <div key={row.decision} className="flex items-center gap-3">
                  <div className="w-72 text-sm font-medium truncate">{row.decision}</div>
                  <Badge className="bg-muted text-foreground">{row.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Memo Generation History (last 30 days)</CardTitle>
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

      {/* Top Memos */}
      <Card>
        <CardHeader>
          <CardTitle>Top Investment Memos</CardTitle>
        </CardHeader>
        <CardContent>
          {memoCards.length === 0 ? (
            <p className="text-muted-foreground text-sm">No investment memos generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Opportunity</th>
                    <th className="text-left p-2">Cluster</th>
                    <th className="text-left p-2">Confidence</th>
                    <th className="text-left p-2">Recommendation</th>
                    <th className="text-left p-2">v</th>
                    <th className="text-left p-2">Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {memoCards.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium truncate max-w-xs">
                        {row.opportunity_title}
                      </td>
                      <td className="p-2 truncate max-w-xs">{row.cluster_name ?? "—"}</td>
                      <td className="p-2 font-bold">{row.confidence}%</td>
                      <td className="p-2">{row.recommendation}</td>
                      <td className="p-2">{row.memo_version}</td>
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