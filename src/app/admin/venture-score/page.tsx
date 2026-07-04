/**
 * /admin/venture-score — Admin view for Venture Score distribution
 *
 * Shows grade histogram, average, distribution, and batch scoring action.
 */
export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layout/AdminLayout";
import { getVentureScoreDashboardStats } from "@/services/venture-score/venture-score.service";
import { BatchScoreButton } from "./BatchScoreButton";

export default async function AdminVentureScorePage() {
  const stats = await getVentureScoreDashboardStats();

  const gradeColors: Record<string, string> = {
    AAA: "bg-green-100 text-green-800",
    AA: "bg-emerald-100 text-emerald-800",
    A: "bg-blue-100 text-blue-800",
    BBB: "bg-yellow-100 text-yellow-800",
    BB: "bg-orange-100 text-orange-800",
    B: "bg-red-100 text-red-800",
    Reject: "bg-gray-100 text-gray-800",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Venture Score Admin</h1>
            <p className="text-muted-foreground mt-1">
              Score distribution, grade histogram, and batch operations.
            </p>
          </div>
          <BatchScoreButton />
        </div>

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
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-3xl font-bold">{stats.average.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Top Confidence</p>
              <p className="text-3xl font-bold">{stats.topByConfidence}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Lowest Risk</p>
              <p className="text-3xl font-bold">{stats.lowestRisk}</p>
            </CardContent>
          </Card>
        </div>

        {/* Grade histogram */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.gradeDistribution).map(([grade, count]) => {
                const maxCount = Math.max(...Object.values(stats.gradeDistribution), 1);
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <span className={`w-12 text-center px-2 py-0.5 rounded text-xs font-medium ${gradeColors[grade] ?? "bg-gray-100"}`}>
                      {grade}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recommendation distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendation Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              {Object.entries(stats.recommendationDistribution).map(([rec, count]) => (
                <div key={rec}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
