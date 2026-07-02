/**
 * Sprint 61: AI Investment Committee Service
 *
 * Multi-agent decision engine: five AI "VC partners" independently evaluate
 * the same opportunity. Their votes are aggregated into a committee decision.
 *
 * Architecture:
 * - AI provider returns business data only (no IDs)
 * - Service orchestrates: fetch context → call AI → persist
 * - Repository owns persistence
 */

import { getAIProviderFromEnv } from "@/lib/ai";
import { CommitteeRepository, CommitteeVotesRepository } from "@/lib/repositories/committee.repository";
import type {
  InvestmentCommitteeRow,
  CommitteeStats,
  CommitteeGenerationResult,
  CommitteeWithVotes,
  CommitteeCardData,
  CommitteeDecision,
} from "@/types/investment-committee";
import { COMMITTEE_AGENT_PROFILES,
  bucketDecisionByScore,
  voteToNumeric,
  CommitteeVoteValue,
} from "@/types/investment-committee";
import type { CommitteeVoteContext } from "@/types/investment-committee";
import type { Uuid } from "@/types/database.types";

function getCommitteeRepo() { return new CommitteeRepository(); }
function getVotesRepo() { return new CommitteeVotesRepository(); }

/**
 * Run the AI Investment Committee for a given opportunity.
 * Fetches context, calls AI provider, persists votes + committee decision.
 */
export async function runCommittee(
  opportunityId: Uuid,
  context: CommitteeVoteContext,
): Promise<InvestmentCommitteeRow> {
  // Call AI provider (all five agents vote in one request)
  const provider = getAIProviderFromEnv();
  const votes = await provider.generateCommitteeVote({
    context,
    agents: COMMITTEE_AGENT_PROFILES.map(a => ({
      name: a.name,
      role: a.role,
      focus: a.focus,
      weight: a.weight,
    })),
  });

  // Aggregate votes
  const { committee_score, confidence, consensus, final_decision } = aggregateVotes(votes);

  // Persist committee
  const committee = await getCommitteeRepo().create({
    opportunity_id: opportunityId,
    committee_score,
    confidence,
    consensus,
    final_decision,
    votes_count: votes.length,
    summary: null,
  });

  // Persist votes
  await getVotesRepo().insertBatch(
    votes.map(v => ({
      committee_id: committee.id,
      agent_name: v.agent_name,
      agent_role: v.agent_role,
      vote: v.vote,
      score: v.score,
      confidence: v.confidence,
      reasoning: v.reasoning,
      weight: v.weight,
    }))
  );

  return committee;
}

/**
 * Aggregate individual agent votes into committee-level metrics.
 */
export function aggregateVotes(votes: Array<{
  vote: string;
  score: number;
  confidence: number;
  weight: number;
}>): {
  committee_score: number;
  confidence: number;
  consensus: number;
  final_decision: string;
} {
  if (votes.length === 0) {
    return {
      committee_score: 0,
      confidence: 0,
      consensus: 0,
      final_decision: "REJECT",
    };
  }

  // Weighted committee score
  const totalWeight = votes.reduce((sum, v) => sum + v.weight, 0);
  const weightedScore =
    votes.reduce((sum, v) => sum + v.score * v.weight, 0) / totalWeight;

  // Average confidence
  const avgConfidence = votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;

  // Consensus: measure variance in vote values
  const voteNumeric = votes.map(v => voteToNumeric(v.vote as CommitteeVoteValue));
  const avgVote = voteNumeric.reduce((sum, n) => sum + n, 0) / voteNumeric.length;
  const variance = voteNumeric.reduce((sum, n) => sum + Math.pow(n - avgVote, 2), 0) / voteNumeric.length;
  const stdDev = Math.sqrt(variance);
  // Consensus: 100 = perfect agreement, 0 = maximum disagreement
  // Max possible stdDev ≈ 40 (votes ranging from 0 to 100)
  const consensus = Math.max(0, Math.min(100, 100 - (stdDev / 40) * 100));

  // Final decision bucket
  const final_decision = bucketDecisionByScore(weightedScore);

  return {
    committee_score: Math.round(weightedScore * 100) / 100,
    confidence: Math.round(avgConfidence * 100) / 100,
    consensus: Math.round(consensus * 100) / 100,
    final_decision,
  };
}

/**
 * Calculate committee statistics.
 */
export async function calculateCommitteeStats(): Promise<CommitteeStats> {
  const committees = await getCommitteeRepo().list({ limit: 10000 });
  const total = committees.length;

  if (total === 0) {
    return {
      total: 0,
      averageConsensus: 0,
      averageConfidence: 0,
      approvalRate: 0,
      strongBuyCount: 0,
      buyCount: 0,
      neutralCount: 0,
      passCount: 0,
      rejectCount: 0,
    };
  }

  const sumConsensus = committees.reduce((sum, c) => sum + parseFloat(c.consensus), 0);
  const sumConfidence = committees.reduce((sum, c) => sum + parseFloat(c.confidence), 0);

  const strongBuyCount = committees.filter(c => c.final_decision === "STRONG_BUY").length;
  const buyCount = committees.filter(c => c.final_decision === "BUY").length;
  const neutralCount = committees.filter(c => c.final_decision === "NEUTRAL").length;
  const passCount = committees.filter(c => c.final_decision === "PASS").length;
  const rejectCount = committees.filter(c => c.final_decision === "REJECT").length;

  const approvalRate = ((strongBuyCount + buyCount) / total) * 100;

  return {
    total,
    averageConsensus: sumConsensus / total,
    averageConfidence: sumConfidence / total,
    approvalRate,
    strongBuyCount,
    buyCount,
    neutralCount,
    passCount,
    rejectCount,
  };
}

/**
 * Get committee with all votes.
 */
export async function getCommitteeWithVotes(committeeId: Uuid): Promise<CommitteeWithVotes | null> {
  const committee = await getCommitteeRepo().findById(committeeId);
  if (!committee) return null;

  const votes = await getVotesRepo().findByCommitteeId(committeeId);
  return { committee, votes };
}

/**
 * Get committee by opportunity ID.
 */
export async function getCommitteeByOpportunityId(opportunityId: Uuid): Promise<InvestmentCommitteeRow | null> {
  return getCommitteeRepo().findByOpportunityId(opportunityId);
}

/**
 * List committees with pagination.
 */
export async function listCommittees(filters?: {
  finalDecision?: string;
  minCommitteeScore?: number;
  limit?: number;
  offset?: number;
}): Promise<InvestmentCommitteeRow[]> {
  return getCommitteeRepo().list(filters);
}

/**
 * Generate committees for multiple opportunities (batch pipeline stage).
 */
export async function generateCommitteesForOpportunities(
  opportunities: Array<{ id: Uuid; context: CommitteeVoteContext }>,
): Promise<CommitteeGenerationResult> {
  let processed = 0;
  let generated = 0;
  let inserted = 0;
  let skipped = 0;

  for (const opp of opportunities) {
    processed++;
    try {
      // Check if committee already exists
      const existing = await getCommitteeRepo().findByOpportunityId(opp.id);
      if (existing) {
        skipped++;
        continue;
      }

      // Run committee
      await runCommittee(opp.id, opp.context);
      generated++;
      inserted++;
    } catch (error) {
      console.error(`Committee generation failed for opportunity ${opp.id}:`, error);
      skipped++;
    }
  }

  return { processed, generated, inserted, skipped };
}

/**
 * Get committee cards for dashboard.
 */
export async function getCommitteeCards(limit = 10): Promise<CommitteeCardData[]> {
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { data, error } = await supabase
    .from("investment_committees")
    .select(`
      id,
      opportunity_id,
      final_decision,
      committee_score,
      confidence,
      consensus,
      votes_count,
      created_at,
      opportunities!inner(title)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch committee cards: ${error.message}`);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as Uuid,
    opportunity_id: row.opportunity_id as Uuid,
    opportunity_title: (row.opportunities as Record<string, unknown>)?.title as string,
    final_decision: row.final_decision as CommitteeDecision,
    committee_score: parseFloat(row.committee_score as string),
    confidence: parseFloat(row.confidence as string),
    consensus: parseFloat(row.consensus as string),
    votes_count: Number(row.votes_count),
    created_at: row.created_at as string,
  }));
}
