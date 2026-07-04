/**
 * Sprint 67: Investment Committee Dashboard
 *
 * Shows latest committee decisions, split votes, high-confidence opportunities.
 */
export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  getCommitteeCards,
  getCommitteeStats,
} from "@/services/investment-committee/committee.service";
import {
  VOTE_COLORS,
  DECISION_COLORS,
  DECISION_ICONS,
} from "@/services/investment-committee/investment-committee.constants";
import Link from "next/link";

const DECISION_ORDER = ["Strong Buy", "Buy", "Watch", "Reject"] as const;

function DecisionBadge({ decision }: { decision: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${DECISION_COLORS[decision] ?? "bg-gray-100 text-gray-800"}`}
    >
      {DECISION_ICONS[decision] ?? "⬜"} {decision}
    </span>
  );
}

function VoteBar({ cards }: { cards: Awaited<ReturnType<typeof getCommitteeCards>> }) {
  const counts = { "Strong Buy": 0, Buy: 0, Watch: 0, Reject: 0 };
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
            <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
              <div
                className={`h-full ${d === "Strong Buy" ? "bg-green-500" : d === "Buy" ? "bg-green-400" : d === "Watch" ? "bg-yellow-400" : "bg-red-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 text-xs text-right font-medium">{n}</span>
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
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🎯 Investment Committee</h1>
          <p className="text-muted-foreground mt-1">
            Multi-agent AI evaluation — five independent perspectives, one decision.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Avg Score</p>
              <p className="text-3xl font-bold">{stats.averageScore.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
              <p className="text-3xl font-bold">{stats.averageConfidence.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="text-3xl font-bold text-green-600">{stats.approvalRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Top Score</p>
              <p className="text-3xl font-bold">{stats.topScore.toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Decision Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Decision Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {cards.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No committee reviews yet.
                </p>
              ) : (
                <VoteBar cards={cards} />
              )}
            </CardContent>
          </Card>

          {/* Decision breakdown counts */}
          <Card>
            <CardHeader>
              <CardTitle>Committee Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-4xl font-bold text-green-700">
                    {stats.strongBuyCount + stats.buyCount}
                  </p>
                  <p className="text-sm text-green-700 mt-1">Approved</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-4xl font-bold text-red-700">{stats.rejectCount}</p>
                  <p className="text-sm text-red-700 mt-1">Rejected</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-4xl font-bold text-yellow-700">{stats.watchCount}</p>
                  <p className="text-sm text-yellow-700 mt-1">Watch</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-4xl font-bold text-gray-500">
                    {stats.strongBuyCount}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Strong Buy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Committee Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No committee reviews yet. Run a committee on any opportunity to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/opportunities/${card.opportunity_id}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {card.opportunity_title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {card.majority_vote && (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${VOTE_COLORS[card.majority_vote] ?? "bg-gray-100"}`}>
                            {card.majority_vote}
                          </span>
                        )}
                        {card.minority_vote && card.minority_vote !== card.majority_vote && (
                          <span className="text-xs text-muted-foreground">
                            ← minority: {card.minority_vote}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold">{card.overall_score.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">score</p>
                        </div>
                        <DecisionBadge decision={card.final_decision} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(card.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link
            href="/admin/committee"
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm font-medium"
          >
            → Admin Panel
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}