/**
 * Sprint 67: Investment Committee Admin
 *
 * Full committee management: history, agent stats, strong buy/rejected lists.
 */
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCommitteeCards,
  getCommitteeStats,
  getAgentStats,
  listStrongBuy,
  listRejected,
} from "@/services/investment-committee/committee.service";
import {
  AGENT_EMOJI,
  VOTE_COLORS,
  DECISION_COLORS,
  DECISION_ICONS,
} from "@/services/investment-committee/investment-committee.constants";

function DecisionBadge({ decision }: { decision: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${DECISION_COLORS[decision] ?? "bg-gray-100 text-gray-800"}`}
    >
      {DECISION_ICONS[decision] ?? "⬜"} {decision}
    </span>
  );
}

function AgentCard({ name, label, type }: { name: string; label: string; type: "optimistic" | "conservative" }) {
  const emoji = AGENT_EMOJI[name] ?? "🤖";
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${type === "optimistic" ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{name}</p>
      </div>
    </div>
  );
}

export default async function CommitteeAdminPage() {
  const [cards, stats, agentStats, strongBuy, rejected] = await Promise.all([
    getCommitteeCards(100),
    getCommitteeStats(),
    getAgentStats(),
    listStrongBuy(5),
    listRejected(5),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎯 Investment Committee Admin</h1>
          <p className="text-sm text-muted-foreground">
            AI multi-agent evaluation engine — 5 independent partners, 1 decision.
          </p>
        </div>
        <Link
          href="/dashboard/committee"
          className="text-sm text-blue-600 hover:underline"
        >
          Dashboard →
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground">Total Reviews</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground">Avg Score</p>
          <p className="text-3xl font-bold">{stats.averageScore.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground">Avg Confidence</p>
          <p className="text-3xl font-bold">{stats.averageConfidence.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground">Approval Rate</p>
          <p className="text-3xl font-bold text-green-600">{stats.approvalRate}%</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground">Agreement Rate</p>
          <p className="text-3xl font-bold">{agentStats.agreementRate}%</p>
        </div>
      </div>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <AgentCard
              name={agentStats.mostOptimistic}
              label="Most Optimistic Agent"
              type="optimistic"
            />
            <AgentCard
              name={agentStats.mostConservative}
              label="Most Conservative Agent"
              type="conservative"
            />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Agreement rate: {agentStats.agreementRate}% of committees reached consensus without a minority dissent.
          </div>
        </CardContent>
      </Card>

      {/* Strong Buy & Rejected Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">✅ Strong Buy ({stats.strongBuyCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {strongBuy.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No strong buy opportunities yet.</p>
            ) : (
              <div className="space-y-2">
                {strongBuy.map((item) => (
                  <Link
                    key={item.id}
                    href={`/opportunities/${item.opportunity_id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border"
                  >
                    <span className="text-sm font-medium truncate mr-2">{item.opportunity_id}</span>
                    <span className="text-sm font-bold shrink-0">{Number(item.overall_score).toFixed(1)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">❌ Rejected ({stats.rejectCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {rejected.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No rejected opportunities yet.</p>
            ) : (
              <div className="space-y-2">
                {rejected.map((item) => (
                  <Link
                    key={item.id}
                    href={`/opportunities/${item.opportunity_id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border"
                  >
                    <span className="text-sm font-medium truncate mr-2">{item.opportunity_id}</span>
                    <span className="text-sm font-bold shrink-0">{Number(item.overall_score).toFixed(1)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Committee History</CardTitle>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No committee reviews yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Opportunity</th>
                    <th className="pb-2 font-medium">Decision</th>
                    <th className="pb-2 font-medium">Score</th>
                    <th className="pb-2 font-medium">Confidence</th>
                    <th className="pb-2 font-medium">Majority</th>
                    <th className="pb-2 font-medium">Minority</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2">
                        <Link
                          href={`/opportunities/${card.opportunity_id}`}
                          className="hover:underline text-blue-600 truncate max-w-[200px] block"
                        >
                          {card.opportunity_title}
                        </Link>
                      </td>
                      <td className="py-2">
                        <DecisionBadge decision={card.final_decision} />
                      </td>
                      <td className="py-2 font-semibold">
                        {card.overall_score.toFixed(1)}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {card.confidence.toFixed(1)}%
                      </td>
                      <td className="py-2">
                        {card.majority_vote ? (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${VOTE_COLORS[card.majority_vote] ?? "bg-gray-100"}`}>
                            {card.majority_vote}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        {card.minority_vote ? (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${VOTE_COLORS[card.minority_vote] ?? "bg-gray-100"}`}>
                            {card.minority_vote}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(card.created_at).toLocaleDateString()}
                      </td>
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