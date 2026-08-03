/**
 * Sprint 67: Investment Committee Dashboard
 * UI-4 polish — uses the design system tokens (AppLayout, PageHeader,
 * MetricCard, Badge variants, EmptyState).
 */
export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getCommitteeCards,
  getCommitteeStats,
} from "@/services/investment-committee/committee.service";
import { Sparkles, Scale, TrendingUp, Star, ExternalLink } from "lucide-react";

const DECISION_ORDER = ["Strong Buy", "Buy", "Watch", "Reject"] as const;

function decisionVariant(decision: string) {
  switch (decision) {
    case "Strong Buy":
      return "hot";
    case "Buy":
      return "good";
    case "Watch":
      return "watch";
    case "Reject":
      return "risk";
    default:
      return "secondary";
  }
}

function VoteBar({ cards }: { cards: Awaited<ReturnType<typeof getCommitteeCards>> }) {
  const counts: Record<string, number> = {};
  for (const c of cards) counts[c.final_decision] = (counts[c.final_decision] ?? 0) + 1;
  const total = cards.length || 1;

  return (
    <div className="space-y-2">
      {DECISION_ORDER.map((d) => {
        const n = counts[d] ?? 0;
        const pct = Math.round((n / total) * 100);
        return (
          <div key={d} className="flex items-center gap-2">
            <span className="w-20 text-xs text-muted-foreground">{d}</span>
            <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
              <div
                className={`h-full ${
                  d === "Strong Buy"
                    ? "bg-signal-hot"
                    : d === "Buy"
                      ? "bg-signal-good"
                      : d === "Watch"
                        ? "bg-signal-watch"
                        : "bg-signal-risk"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 text-xs text-right font-medium tabular-nums">
              {n}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default async function CommitteeDashboardPage() {
  const [cards, stats] = await Promise.all([
    getCommitteeCards(50),
    getCommitteeStats(),
  ]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Investment Committee"
          description="Multi-agent AI evaluation — 5 góc nhìn độc lập, một quyết định."
          badge={<Badge variant="ai-soft">Sprint 67</Badge>}
          actions={
            <Link
              href="/admin/committee"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Admin Panel
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Tổng lượt review"
            value={stats.total}
            icon={<Sparkles className="h-4 w-4" />}
          />
          <MetricCard
            title="Score trung bình"
            value={stats.averageScore.toFixed(1)}
            tone="info"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Confidence TB"
            value={Math.round(stats.averageConfidence)}
            suffix="%"
            icon={<Scale className="h-4 w-4" />}
          />
          <MetricCard
            title="Approval Rate"
            value={stats.approvalRate}
            suffix="%"
            tone="hot"
            icon={<Star className="h-4 w-4" />}
          />
          <MetricCard
            title="Top Score"
            value={stats.topScore.toFixed(1)}
            tone="ai"
            icon={<Star className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Phân bố quyết định</CardTitle>
            </CardHeader>
            <CardContent>
              {cards.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Chưa có committee review"
                  description="Chạy committee trên một opportunity để bắt đầu."
                />
              ) : (
                <VoteBar cards={cards} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng kết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Bucket
                  label="Approved"
                  value={stats.strongBuyCount + stats.buyCount}
                  tone="hot"
                />
                <Bucket label="Watch" value={stats.watchCount} tone="watch" />
                <Bucket label="Rejected" value={stats.rejectCount} tone="risk" />
                <Bucket
                  label="Strong Buy"
                  value={stats.strongBuyCount}
                  tone="info"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Review gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="Chưa có review nào"
                description="Chạy committee trên một opportunity để có review đầu tiên."
              />
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/opportunities/${card.opportunity_id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {card.opportunity_title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {card.majority_vote && (
                          <Badge variant={decisionVariant(card.majority_vote)}>
                            {card.majority_vote}
                          </Badge>
                        )}
                        {card.minority_vote &&
                          card.minority_vote !== card.majority_vote && (
                            <span className="text-xs text-muted-foreground">
                              minority: {card.minority_vote}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold tabular-nums">
                          {card.overall_score.toFixed(1)}
                        </p>
                        <p className="text-[10px] uppercase text-muted-foreground">
                          score
                        </p>
                      </div>
                      <Badge variant={decisionVariant(card.final_decision)}>
                        {card.final_decision}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function Bucket({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "hot" | "watch" | "risk" | "info";
}) {
  const toneClass = {
    hot: "border-signal-hot/30 bg-signal-hot-soft/40 text-signal-hot-foreground",
    watch:
      "border-signal-watch/30 bg-signal-watch-soft/40 text-signal-watch-foreground",
    risk: "border-signal-risk/30 bg-signal-risk-soft/40 text-signal-risk-foreground",
    info: "border-signal-info/30 bg-signal-info-soft/40 text-signal-info-foreground",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 text-center ${toneClass}`}>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider opacity-80">
        {label}
      </p>
    </div>
  );
}
