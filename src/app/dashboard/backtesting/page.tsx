/**
 * Sprint 59: Backtesting Dashboard Page (Server Component)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { BacktestRefreshButton } from "@/components/backtesting/backtest-refresh-button";
import { BacktestTable } from "@/components/backtesting/backtest-table";
import { getStatistics, listBacktests } from "@/services/backtesting/backtesting.service";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BacktestingDashboardPage() {
  const [stats, backtests] = await Promise.all([
    getStatistics(),
    listBacktests({ limit: 50, orderBy: "evaluation_date", ascending: false }),
  ]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Backtesting</h1>
            <p className="text-muted-foreground mt-1">
              Historical accuracy of investment predictions — every opportunity tracked over time
            </p>
          </div>
          <BacktestRefreshButton />
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats.averageAccuracy ?? 0) >= 70 ? "text-green-700" : (stats.averageAccuracy ?? 0) >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                {stats.averageAccuracy != null ? `${stats.averageAccuracy.toFixed(1)}%` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.evaluated} / {stats.total} evaluated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Delta</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {stats.averageDelta != null ? `±${stats.averageDelta.toFixed(1)}` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Prediction error</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Predictions</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {stats.successfulPredictions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Accuracy &ge; 60%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Predictions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.failedPredictions > 0 ? "text-red-600" : "text-green-700"}`}>
                {stats.failedPredictions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Accuracy ≡ 40%</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Accuracy</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {stats.bestAccuracy != null ? `${stats.bestAccuracy.toFixed(1)}%` : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Worst Accuracy</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats.worstAccuracy ?? 100) < 50 ? "text-red-600" : "text-yellow-600"}`}>
                {stats.worstAccuracy != null ? `${stats.worstAccuracy.toFixed(1)}%` : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backtest Table */}
        <BacktestTable initialBacktests={backtests} />
      </div>
    </AppLayout>
  );
}