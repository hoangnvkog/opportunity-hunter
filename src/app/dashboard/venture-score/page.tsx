/**
 * /dashboard/venture-score — Venture Score overview
 *
 * Shows top scores, latest scores, grade distribution, and filtering.
 */
export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layout/AdminLayout";
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

  const gradeColors: Record<string, string> = {
    AAA: "bg-green-100 text-green-800 border-green-300",
    AA: "bg-emerald-100 text-emerald-800 border-emerald-300",
    A: "bg-blue-100 text-blue-800 border-blue-300",
    BBB: "bg-yellow-100 text-yellow-800 border-yellow-300",
    BB: "bg-orange-100 text-orange-800 border-orange-300",
    B: "bg-red-100 text-red-800 border-red-300",
    Reject: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const recColors: Record<string, string> = {
    "Strong Buy": "bg-green-100 text-green-800",
    Buy: "bg-emerald-100 text-emerald-800",
    Watch: "bg-yellow-100 text-yellow-800",
    Speculative: "bg-orange-100 text-orange-800",
    Reject: "bg-red-100 text-red-800",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Venture Score Engine</h1>
        <p className="text-muted-foreground">
          Deterministic investment scoring across all venture analysis modules.
        </p>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Scores</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-3xl font-bold">{stats.average.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">AAA Opportunities</p>
              <p className="text-3xl font-bold">{stats.gradeDistribution.AAA ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Top ROI Score</p>
              <p className="text-3xl font-bold">{stats.topByROI}</p>
            </CardContent>
          </Card>
        </div>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${gradeColors[grade] ?? "bg-gray-100"}`}>
                    {grade}
                  </span>
                  <p className="text-lg font-bold mt-1">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Top Venture Scores</CardTitle>
          </CardHeader>
          <CardContent>
            {topScores.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No scores computed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
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
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 font-semibold">{Number(s.overall_score).toFixed(1)}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${gradeColors[s.investment_grade] ?? "bg-gray-100"}`}>
                            {s.investment_grade}
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${recColors[s.recommendation] ?? "bg-gray-100"}`}>
                            {s.recommendation}
                          </span>
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
            <CardTitle>Latest Scores</CardTitle>
          </CardHeader>
          <CardContent>
            {latestScores.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No scores computed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Opportunity</th>
                      <th className="pb-2 font-medium">Score</th>
                      <th className="pb-2 font-medium">Grade</th>
                      <th className="pb-2 font-medium">Rec</th>
                      <th className="pb-2 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestScores.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 truncate max-w-[200px]">{s.opportunity_title}</td>
                        <td className="py-2 font-semibold">{s.overall_score.toFixed(1)}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${gradeColors[s.investment_grade] ?? "bg-gray-100"}`}>
                            {s.investment_grade}
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${recColors[s.recommendation] ?? "bg-gray-100"}`}>
                            {s.recommendation}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
