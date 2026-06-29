/**
 * Sprint 56: Admin Investment Page
 *
 * Admin view for startup scores + charts:
 * - Score distribution
 * - Average by dimension
 * - Top investment opportunities
 * - Recommendation breakdown
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StartupScoresRepository } from "@/lib/db/repositories/startup-scores.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";

export const dynamic = "force-dynamic";

export default async function AdminInvestmentPage() {
  const [scoresRepo, oppRepo] = await Promise.all([
    StartupScoresRepository.create(),
    OpportunitiesRepository.create(),
  ]);

  const [
    scoreCards,
    stats,
    distribution,
    dimensionAverages,
    recommendationBreakdown,
  ] = await Promise.all([
    scoresRepo.listCards({ limit: 100 }),
    scoresRepo.getStats(),
    scoresRepo.getScoreDistribution(),
    scoresRepo.getDimensionAverages(),
    scoresRepo.getRecommendationBreakdown(),
  ]);

  const oppIds = [...new Set(scoreCards.map((s) => s.opportunity_id))];
  const opportunities = await oppRepo.findByIds(oppIds);
  const opportunityMap = new Map(opportunities.map((o) => [o.id, o.title]));

  const maxBucketCount = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investment Scoring</h1>
        <p className="text-muted-foreground mt-1">
          {stats.total} scored opportunities · avg overall{" "}
          {Math.round(stats.averageOverallScore)} · {stats.investmentGradeCount} investment-grade
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
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {Math.round(stats.highestOverallScore)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Investment Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.investmentGradeCount}
            </div>
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
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <p className="text-muted-foreground text-sm">No records yet.</p>
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

      {/* Average by Dimension */}
      <Card>
        <CardHeader>
          <CardTitle>Average by Dimension</CardTitle>
        </CardHeader>
        <CardContent>
          {dimensionAverages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {dimensionAverages.map((dim) => (
                <div key={dim.dimension} className="flex items-center gap-3">
                  <div className="w-40 text-sm font-medium">{dim.label}</div>
                  <div className="flex-1 bg-muted rounded h-5 relative">
                    <div
                      className="bg-purple-500 h-full rounded"
                      style={{ width: `${Math.min(100, dim.average)}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-medium">
                    {Math.round(dim.average)}
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

      {/* Top Investment Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Top Investment Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          {scoreCards.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No startup scores generated yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Opportunity</th>
                    <th className="text-left p-2">Overall</th>
                    <th className="text-left p-2">TAM</th>
                    <th className="text-left p-2">Timing</th>
                    <th className="text-left p-2">Competition</th>
                    <th className="text-left p-2">Moat</th>
                    <th className="text-left p-2">Distribution</th>
                    <th className="text-left p-2">Execution</th>
                    <th className="text-left p-2">Capital</th>
                    <th className="text-left p-2">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreCards.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium truncate max-w-xs">
                        {opportunityMap.get(row.opportunity_id) ?? "Unknown"}
                      </td>
                      <td className="p-2 font-bold">{row.overall_score}</td>
                      <td className="p-2">{row.tam_score}</td>
                      <td className="p-2">{row.market_timing_score}</td>
                      <td className="p-2">{row.competition_score}</td>
                      <td className="p-2">{row.moat_score}</td>
                      <td className="p-2">{row.distribution_score}</td>
                      <td className="p-2">{row.execution_score}</td>
                      <td className="p-2">{row.capital_efficiency_score}</td>
                      <td className="p-2">{row.recommendation ?? "—"}</td>
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