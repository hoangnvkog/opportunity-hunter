"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AGENT_EMOJI,
  AGENT_DISPLAY_NAMES,
  VOTE_COLORS,
  DECISION_COLORS,
  DECISION_ICONS,
} from "@/services/investment-committee/investment-committee.constants";
import type {
  CommitteeWithVotes,
  CommitteeVoteRow,
} from "@/services/investment-committee/investment-committee.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VoteDisplayValue = "Strong Buy" | "Buy" | "Watch" | "Reject";
type VoteRawValue = "STRONG_BUY" | "BUY" | "NEUTRAL" | "PASS" | "REJECT";

interface VoteMap {
  [key: string]: VoteDisplayValue;
}

const VOTE_DISPLAY_MAP: VoteMap = {
  STRONG_BUY: "Strong Buy",
  BUY: "Buy",
  NEUTRAL: "Watch",
  PASS: "Watch",
  REJECT: "Reject",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDecisionLabel(decision: string): VoteDisplayValue {
  return VOTE_DISPLAY_MAP[decision as VoteRawValue] ?? "Watch";
}

function parseScore(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(String(value));
}

function parseReasoning(reasoning: string): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  const lines = reasoning.split(/\n|\\n/);
  let capture: "pros" | "cons" | null = null;

  for (const line of lines) {
    const trimmed = line.trim().replace(/^[-*•]\s*/, "").replace(/^\*+/, "").trim();
    const lower = trimmed.toLowerCase();

    if (lower.includes("pros") || lower.includes("strength") || lower.includes("positive")) {
      capture = "pros";
      continue;
    }
    if (lower.includes("cons") || lower.includes("risk") || lower.includes("concern")) {
      capture = "cons";
      continue;
    }

    if (
      trimmed &&
      (trimmed.startsWith("-") || trimmed.startsWith("*") || /^[A-Z]/.test(trimmed))
    ) {
      const cleaned = trimmed.replace(/^[-*]\s*/, "").trim();
      if (!cleaned) continue;
      if (capture === "pros") {
        pros.push(cleaned);
      } else if (capture === "cons") {
        cons.push(cleaned);
      } else {
        // default: categorize by keywords
        const neg =
          lower.includes("risk") ||
          lower.includes("concern") ||
          lower.includes("challenge") ||
          lower.includes("negative") ||
          lower.includes("weak");
        if (neg) {
          cons.push(cleaned);
        } else {
          pros.push(cleaned);
        }
      }
    }
  }

  // fallback
  if (pros.length === 0 && cons.length === 0) {
    const sentences = reasoning.split(/(?<=[.!?])\s+/).filter(Boolean);
    sentences.slice(0, 3).forEach((s) => pros.push(s.trim()));
  }

  return { pros, cons };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VoteBadge({ vote }: { vote: string }) {
  const label = getDecisionLabel(vote);
  const colorClass =
    label === "Strong Buy" || label === "Buy"
      ? VOTE_COLORS.BUY
      : label === "Watch"
        ? VOTE_COLORS.WATCH
        : VOTE_COLORS.PASS;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const label = getDecisionLabel(decision);
  const colorClass = DECISION_COLORS[label] ?? DECISION_COLORS.Watch;
  const icon = DECISION_ICONS[label] ?? "👀";
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function VoteBreakdownChart({ votes }: { votes: CommitteeVoteRow[] }) {
  const counts: Record<string, number> = {};
  const voteOrder: Record<string, number> = {
    STRONG_BUY: 4,
    BUY: 3,
    NEUTRAL: 2,
    PASS: 1,
    REJECT: 0,
  };

  for (const v of votes) {
    counts[v.vote] = (counts[v.vote] ?? 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => {
    return (voteOrder[b[0]] ?? 0) - (voteOrder[a[0]] ?? 0);
  });

  const max = Math.max(...sorted.map(([, c]) => c), 1);

  const barColors: Record<string, string> = {
    STRONG_BUY: "bg-green-500",
    BUY: "bg-green-400",
    NEUTRAL: "bg-yellow-400",
    PASS: "bg-orange-400",
    REJECT: "bg-red-400",
  };

  return (
    <div className="space-y-2">
      {sorted.map(([vote, count]) => {
        const pct = (count / max) * 100;
        return (
          <div key={vote} className="flex items-center gap-3 text-sm">
            <div className="w-20 shrink-0 text-right">
              <VoteBadge vote={vote} />
            </div>
            <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColors[vote] ?? "bg-gray-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-6 text-center font-medium">{count}</div>
          </div>
        );
      })}
    </div>
  );
}

function AgentVoteCard({ vote }: { vote: CommitteeVoteRow }) {
  const { pros, cons } = parseReasoning(vote.reasoning);
  const score = parseScore(vote.score);
  const confidence = parseScore(vote.confidence);
  const displayName = AGENT_DISPLAY_NAMES[vote.agent_name] ?? vote.agent_role;
  const emoji = AGENT_EMOJI[vote.agent_name] ?? "🤖";

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <div>
              <CardTitle className="text-base">{displayName}</CardTitle>
              <p className="text-xs text-muted-foreground">{vote.agent_role}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <VoteBadge vote={vote.vote} />
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Score: <strong>{score.toFixed(0)}</strong></span>
              <span>Conf: <strong>{confidence.toFixed(0)}%</strong></span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground italic leading-relaxed">
          {vote.reasoning.length > 300
            ? `${vote.reasoning.slice(0, 300).trim()}…`
            : vote.reasoning}
        </div>

        {pros.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700 mb-1">✅ Pros</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
              {pros.slice(0, 4).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {cons.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Cons</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
              {cons.slice(0, 4).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          </div>
          <div className="h-6 w-16 bg-muted rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-4/5 bg-muted rounded" />
        <div className="h-3 w-3/5 bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface CommitteeSectionProps {
  opportunityId: string;
}

export function CommitteeSection({ opportunityId }: CommitteeSectionProps) {
  const [committee, setCommittee] = useState<CommitteeWithVotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCommittee() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/committee/${opportunityId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCommittee(data);
        } else if (res.status === 404) {
          if (!cancelled) setCommittee(null);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load committee");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCommittee();
    return () => {
      cancelled = true;
    };
  }, [opportunityId]);

  async function handleRunCommittee() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/committee/${opportunityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCommittee(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run committee");
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Investment Committee</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Investment Committee</h2>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
            <p className="text-muted-foreground text-center">
              No committee analysis yet for this opportunity.
            </p>
            <Button onClick={handleRunCommittee} disabled={running}>
              {running ? "Running Committee…" : "▶ Run Committee"}
            </Button>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { committee: c, votes } = committee as CommitteeWithVotes & {
    committee: {
      final_decision: string;
      committee_score: string | number;
      confidence: string | number;
      consensus: string | number;
      summary: string | null;
    };
  };
  const score = parseScore(c.committee_score);
  const confidence = parseScore(c.confidence);
  const consensus = parseScore(c.consensus);

  // Determine majority and minority
  const voteCounts: Record<string, number> = {};
  for (const v of votes) {
    voteCounts[v.vote] = (voteCounts[v.vote] ?? 0) + 1;
  }
  const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const majorityVote = sortedVotes[0]?.[0] ?? null;
  const minorityVote = sortedVotes[1]?.[0] ?? null;
  const hasDisagreement = minorityVote !== null && majorityVote !== minorityVote;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Investment Committee</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRunCommittee}
          disabled={running}
        >
          {running ? "Running…" : "🔄 Re-run"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Summary header */}
      <Card className="bg-muted/30">
        <CardContent className="flex flex-wrap items-center gap-6 py-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold">{score.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">Overall Score</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold">{confidence.toFixed(1)}%</span>
            <span className="text-xs text-muted-foreground">Confidence</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold">{consensus.toFixed(1)}%</span>
            <span className="text-xs text-muted-foreground">Consensus</span>
          </div>
          <div className="ml-auto">
            <DecisionBadge decision={c.final_decision} />
          </div>
        </CardContent>
      </Card>

      {/* Vote breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vote Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <VoteBreakdownChart votes={votes} />
        </CardContent>
      </Card>

      {/* Individual agent votes */}
      <div>
        <h3 className="text-lg font-medium mb-3">Agent Analysis</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {votes.map((vote) => (
            <AgentVoteCard key={vote.id} vote={vote} />
          ))}
        </div>
      </div>

      {/* Disagreement / minority opinion section */}
      {hasDisagreement && minorityVote && (
        <Card className="border-amber-300 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span>💬</span> Minority View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Not all agents agreed.{" "}
              <strong>{getDecisionLabel(minorityVote)}</strong> opinion from{" "}
              {voteCounts[minorityVote]} agent(s) who flagged concerns around
              timing, valuation, or risk factors.
            </p>
            {votes
              .filter((v) => v.vote === minorityVote)
              .map((v) => {
                const name = AGENT_DISPLAY_NAMES[v.agent_name] ?? v.agent_role;
                return (
                  <div key={v.id} className="mt-2 text-sm">
                    <strong>{AGENT_EMOJI[v.agent_name] ?? "🤖"} {name}:</strong>{" "}
                    <span className="text-muted-foreground italic">
                      {v.reasoning.slice(0, 200)}
                      {v.reasoning.length > 200 ? "…" : ""}
                    </span>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Summary from committee */}
      {c.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Committee Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {c.summary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}