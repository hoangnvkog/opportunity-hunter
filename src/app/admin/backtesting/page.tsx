/**
 * Sprint 59: Admin Backtesting Page
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import AdminLayout from "@/components/layout/AdminLayout";
import { OpportunityBacktestsRepository } from "@/lib/db/repositories/opportunity-backtests.repository";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, CheckCircle2, Clock, Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBacktestingPage() {
  const repo = await OpportunityBacktestsRepository.create();

  const [
    stats,
    distribution,
    pendingBacktests,
    evaluatedBacktests,
  ] = await Promise.all([
    repo.getStats(),
    repo.getAccuracyDistribution(),
    repo.list({ status: "pending", limit: 10, orderBy: "evaluation_date" }),
    repo.list({ status: "evaluated", limit: 10, orderBy: "accuracy" }),
  ]);

  const chartData = distribution.map((d) => ({
    name: d.range,
    count: d.count,
    fill:
      d.range === "90-100" ? "#16a34a"
      : d.range === "80-90" ? "#22c55e"
      : d.range === "70-80" ? "#84cc16"
      : d.range === "60-70" ? "#eab308"
      : d.range === "40-60" ? "#f97316"
      : d.range === "20-40" ? "#ef4444"
      : "#dc2626",
  }));

  const successRate = stats.evaluated > 0
    ? ((stats.successfulPredictions / stats.evaluated) * 100).toFixed(1)
    : "0.0";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Backtesting</h1>
          <p className="text-muted-foreground mt-1">
            Model prediction accuracy: every investment score validated over time
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Backtests</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.evaluated} evaluated · {stats.pending} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats.averageAccuracy ?? 0) >= 70 ? "text-green-700" : "text-red-600"}`}>
                {stats.averageAccuracy != null ? `${stats.averageAccuracy.toFixed(1)}%` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ±{stats.averageDelta?.toFixed(1) ?? "N/A"} avg error
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{successRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.successfulPredictions} / {stats.evaluated} predictions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Model Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.failedPredictions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                predictions with accuracy ≡ 40%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accuracy Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Accuracy Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">
                No evaluated backtests yet. Run the evaluation batch to populate this chart.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Evaluation Queue */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Evaluations ({pendingBacktests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingBacktests.length > 0 ? (
                <div className="space-y-2">
                  {pendingBacktests.map((bt) => (
                    <div key={bt.id} className="flex items-center justify-between py-1 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">
                        {bt.opportunity_id.slice(0, 8)}
                      </span>
                      <span className="text-muted-foreground">
                        eval {bt.evaluation_date}
                      </span>
                      <span className="text-yellow-600 font-medium">{bt.predicted_score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No pending evaluations</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Worst Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              {evaluatedBacktests.filter((bt) => bt.accuracy !== null).length > 0 ? (
                <div className="space-y-2">
                  {evaluatedBacktests
                    .filter((bt) => bt.accuracy !== null)
                    .sort((a, b) => Number(a.accuracy ?? 100) - Number(b.accuracy ?? 100))
                    .slice(0, 5)
                    .map((bt) => (
                      <div key={bt.id} className="flex items-center justify-between py-1 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">
                          {bt.opportunity_id.slice(0, 8)}
                        </span>
                        <span className="text-red-600 font-bold">{bt.accuracy}%</span>
                        <span className="text-muted-foreground">
                          Δ {bt.prediction_delta}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No evaluated backtests</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}