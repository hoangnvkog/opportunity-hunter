/**
 * Sprint 58: Dashboard Investment Memo Page (Server Component)
 * UI-4 polish — design system tokens, Vietnamese labels, signal badges.
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { InvestmentMemoRefreshButton } from "@/components/investment-memo/investment-memo-refresh-button";
import { InvestmentMemoSearchBar } from "@/components/investment-memo/investment-memo-search-bar";
import { InvestmentMemoTable } from "@/components/investment-memo/investment-memo-table";
import {
  getTopMemosAction,
  getMemoStatisticsAction,
} from "@/actions/investment-memo.actions";
import { FileText, TrendingUp, Coins, Target } from "lucide-react";

export const dynamic = "force-dynamic";

function confidenceTone(score: number): "default" | "info" | "watch" | "hot" {
  if (score >= 80) return "hot";
  if (score >= 60) return "info";
  if (score >= 40) return "watch";
  return "default";
}

export default async function InvestmentMemoDashboardPage() {
  const [statsResult, memosResult] = await Promise.all([
    getMemoStatisticsAction(),
    getTopMemosAction(50),
  ]);

  const stats = statsResult.success ? statsResult.data : null;
  const memos = memosResult.success ? memosResult.data ?? [] : [];

  const avg = Math.round(stats?.averageConfidence ?? 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Investment Memos"
          description="Memo AI cho các cơ hội top — yêu cầu startup_score ≥ 85."
          badge={<Badge variant="ai-soft">Sprint 58</Badge>}
          actions={<InvestmentMemoRefreshButton />}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Tổng memo"
            value={stats?.total ?? 0}
            icon={<FileText className="h-4 w-4" />}
          />
          <MetricCard
            title="Confidence TB"
            value={avg}
            suffix="%"
            tone={confidenceTone(avg)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Strong Buy"
            value={stats?.strongBuyCount ?? 0}
            tone="hot"
            icon={<Coins className="h-4 w-4" />}
            change="Investor Ready"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tìm kiếm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InvestmentMemoSearchBar />
          </CardContent>
        </Card>

        <InvestmentMemoTable initialMemos={memos} />
      </div>
    </AppLayout>
  );
}
