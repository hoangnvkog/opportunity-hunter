/**
 * Sprint 55: Admin Intelligence Page
 *
 * Admin view for market intelligence records + charts:
 * - Signal distribution (overall_score buckets)
 * - Signal history (daily record counts)
 * - Confidence history (daily average confidence)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MarketIntelligenceRepository } from "@/lib/db/repositories/market-intelligence.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";

export const dynamic = "force-dynamic";

export default async function AdminIntelligencePage() {
  const [intelligenceRepo, oppRepo] = await Promise.all([
    MarketIntelligenceRepository.create(),
    OpportunitiesRepository.create(),
  ]);

  const [intelligenceCards, stats, distribution, history, confidenceHistory] =
    await Promise.all([
      intelligenceRepo.listCards({ limit: 100 }),
      intelligenceRepo.getStats(),
      intelligenceRepo.getSignalDistribution(),
      intelligenceRepo.getHistory(30),
      intelligenceRepo.getConfidenceHistory(30),
    ]);

  const oppIds = [...new Set(intelligenceCards.map((i) => i.opportunity_id))];
  const opportunities = await oppRepo.findByIds(oppIds);
  const opportunityMap = new Map(opportunities.map((o) => [o.id, o.title]));

  // Bar widths for signal distribution
  const maxBucketCount = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Market Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          {stats.total} total intelligence records · avg overall{" "}
          {Math.round(stats.averageOverallScore)} · avg confidence{" "}
          {Math.round(stats.averageConfidence)}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Highest Overall</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(stats.highestOverallScore)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Reddit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageRedditScore)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageJobsScore)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Signal Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Signal Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <p className="text-muted-foreground text-sm">No intelligence records yet.</p>
          ) : (
            <div className="space-y-2">
              {distribution.map((bucket) => (
                <div key={bucket.bucket} className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium">{bucket.bucket}</div>
                  <div className="flex-1 bg-muted rounded h-6 relative">
                    <div
                      className="bg-blue-500 h-full rounded"
                      style={{
                        width: `${(bucket.count / maxBucketCount) * 100}%`,
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

      {/* Signal History (daily counts) */}
      <Card>
        <CardHeader>
          <CardTitle>Signal History (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">No history yet.</p>
          ) : (
            <div className="space-y-1">
              {history.map((day) => (
                <div key={day.date} className="flex items-center gap-3 text-sm">
                  <div className="w-24 text-muted-foreground">{day.date}</div>
                  <div className="w-16 font-medium">{day.count} records</div>
                  <div className="flex-1 bg-muted rounded h-4 relative">
                    <div
                      className="bg-green-500 h-full rounded"
                      style={{
                        width: `${Math.min(100, (day.avgScore / 100) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="w-12 text-right">{Math.round(day.avgScore)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confidence History */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence History (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {confidenceHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No history yet.</p>
          ) : (
            <div className="space-y-1">
              {confidenceHistory.map((day) => (
                <div key={day.date} className="flex items-center gap-3 text-sm">
                  <div className="w-24 text-muted-foreground">{day.date}</div>
                  <div className="flex-1 bg-muted rounded h-4 relative">
                    <div
                      className="bg-purple-500 h-full rounded"
                      style={{
                        width: `${Math.min(100, day.avgConfidence)}%`,
                      }}
                    />
                  </div>
                  <div className="w-12 text-right">
                    {Math.round(day.avgConfidence)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent>
          {intelligenceCards.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No market intelligence records generated yet.
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
                  </tr>
                </thead>
                <tbody>
                  {intelligenceCards.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium truncate max-w-xs">
                        {opportunityMap.get(row.opportunity_id) ?? "Unknown"}
                      </td>
                      <td className="p-2 font-bold">{row.overall_score}</td>
                      <td className="p-2">{row.reddit_score}</td>
                      <td className="p-2">{row.github_score}</td>
                      <td className="p-2">{row.product_hunt_score}</td>
                      <td className="p-2">{row.news_score}</td>
                      <td className="p-2">{row.google_trends_score}</td>
                      <td className="p-2">{row.jobs_score}</td>
                      <td className="p-2">{row.confidence}%</td>
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