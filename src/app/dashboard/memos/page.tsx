/**
 * Sprint 58: Dashboard Investment Memo Page (Server Component)
 *
 * Loads initial KPIs + top memos server-side; hands off interactive
 * search and refresh to client components.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvestmentMemoRefreshButton } from "@/components/investment-memo/investment-memo-refresh-button";
import { InvestmentMemoSearchBar } from "@/components/investment-memo/investment-memo-search-bar";
import { InvestmentMemoTable } from "@/components/investment-memo/investment-memo-table";
import {
  getTopMemosAction,
  getMemoStatisticsAction,
} from "@/actions/investment-memo.actions";
import { FileText, TrendingUp, Coins } from "lucide-react";

export const dynamic = "force-dynamic";

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-700";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  return "text-gray-600";
}

export default async function InvestmentMemoDashboardPage() {
  const [statsResult, memosResult] = await Promise.all([
    getMemoStatisticsAction(),
    getTopMemosAction(50),
  ]);

  const stats = statsResult.success ? statsResult.data : null;
  const memos = memosResult.success ? memosResult.data ?? [] : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Investment Memos</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated, decision-oriented memos for top opportunities (startup_score &ge; 85)
            </p>
          </div>
          <InvestmentMemoRefreshButton />
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Memos</CardTitle>
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
              <CardTitle className="text-sm font-medium">Strong Buy</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {stats?.strongBuyCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Investor Ready</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestmentMemoSearchBar />
          </CardContent>
        </Card>

        {/* Memo Table — initial server-loaded; client search results
            are pushed into the same component via a key swap. */}
        <InvestmentMemoTable initialMemos={memos} />
      </div>
    </AppLayout>
  );
}