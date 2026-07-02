/**
 * Sprint 61: AI Investment Committee (Multi-Agent Decision Engine)
 *
 * Types for investment_committees + committee_votes tables.
 *
 * AI provider returns business vote data only (no UUIDs).
 * The repository owns persistence + ID generation.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Five committee agents, each with their own lens on the opportunity. */
export const COMMITTEE_AGENTS = [
  "MARKET_ANALYST",
  "TECHNICAL_PARTNER",
  "FOUNDER_PARTNER",
  "INVESTMENT_PARTNER",
  "RISK_PARTNER",
] as const;

export type CommitteeAgentName = (typeof COMMITTEE_AGENTS)[number];

/** Individual vote values cast by an agent. */
export const COMMITTEE_VOTES = [
  "STRONG_BUY",
  "BUY",
  "NEUTRAL",
  "PASS",
  "REJECT",
] as const;

export type CommitteeVoteValue = (typeof COMMITTEE_VOTES)[number];

/** Final committee decision (consensus bucket). */
export const COMMITTEE_DECISIONS = [
  "STRONG_BUY",
  "BUY",
  "NEUTRAL",
  "PASS",
  "REJECT",
] as const;

export type CommitteeDecision = (typeof COMMITTEE_DECISIONS)[number];

// ---------------------------------------------------------------------------
// Agent profile definitions
// ---------------------------------------------------------------------------

export interface CommitteeAgentProfile {
  name: CommitteeAgentName;
  role: string;
  focus: readonly string[];
  /** Weight when computing the committee score (1.0 default; risk=1.2). */
  weight: number;
}

export const COMMITTEE_AGENT_PROFILES: readonly CommitteeAgentProfile[] = [
  {
    name: "MARKET_ANALYST",
    role: "Market Analyst",
    focus: ["Market Size", "Timing", "Demand"],
    weight: 1.0,
  },
  {
    name: "TECHNICAL_PARTNER",
    role: "Technical Partner",
    focus: ["Difficulty", "Execution", "Technology Risk"],
    weight: 1.0,
  },
  {
    name: "FOUNDER_PARTNER",
    role: "Founder Partner",
    focus: ["Founder Fit", "Distribution", "Execution Speed"],
    weight: 1.0,
  },
  {
    name: "INVESTMENT_PARTNER",
    role: "Investment Partner",
    focus: ["ROI", "Exit", "Business Model"],
    weight: 1.0,
  },
  {
    name: "RISK_PARTNER",
    role: "Risk Partner",
    focus: ["Competition", "Regulation", "Market Risk"],
    weight: 1.2,
  },
] as const;

// ---------------------------------------------------------------------------
// AI Provider I/O (business data only — no IDs)
// ---------------------------------------------------------------------------

export interface CommitteeAgentVote {
  agent_name: CommitteeAgentName;
  agent_role: string;
  vote: CommitteeVoteValue;
  score: number;        // 0-100
  confidence: number;   // 0-100
  reasoning: string;
  weight: number;       // 1.0 default, risk=1.2
}

/**
 * Context handed to the AI provider for each agent.
 * The AI does NOT need to know IDs — only business signal.
 */
export interface CommitteeVoteContext {
  opportunity: {
    title: string;
    description: string;
    score: number;
    cluster_size: number | null;
    severity: number;
    buying_intent: number;
  };
  trend?: {
    direction: string | null;
    momentum_score: number;
  } | null;
  forecast?: {
    growth_rate: number;
    pressure_score: number;
    confidence: number;
  } | null;
  investment_score?: {
    overall_score: number;
    team_score: number;
    market_score: number;
    product_score: number;
    timing_score: number;
    risk_score: number;
  } | null;
  portfolio_position?: {
    status: string;
    priority: string;
  } | null;
}

/** Provider returns votes for ALL five agents in a single call. */
export interface GenerateCommitteeVoteResult {
  votes: CommitteeAgentVote[];
}

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export type InvestmentCommitteeRow = {
  id: Uuid;
  opportunity_id: Uuid;
  committee_score: string; // numeric(5,2)
  confidence: string;      // numeric(5,2)
  consensus: string;       // numeric(5,2)
  final_decision: string;
  votes_count: number;
  summary: string | null;
  created_at: string;
};

export type InvestmentCommitteeInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  committee_score: number;
  confidence: number;
  consensus: number;
  final_decision: string;
  votes_count: number;
  summary?: string | null;
  created_at?: string;
};

export type CommitteeVoteRow = {
  id: Uuid;
  committee_id: Uuid;
  agent_name: string;
  agent_role: string;
  vote: string;
  score: string;       // numeric(5,2)
  confidence: string;  // numeric(5,2)
  reasoning: string;
  weight: string;       // numeric(4,2)
  created_at: string;
};

export type CommitteeVoteInsert = {
  id?: Uuid;
  committee_id: Uuid;
  agent_name: string;
  agent_role: string;
  vote: string;
  score: number;
  confidence: number;
  reasoning: string;
  weight: number;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface CommitteeCardData {
  id: Uuid;
  opportunity_id: Uuid;
  opportunity_title: string;
  final_decision: CommitteeDecision;
  committee_score: number;
  confidence: number;
  consensus: number;
  votes_count: number;
  created_at: string;
}

export interface CommitteeWithVotes {
  committee: InvestmentCommitteeRow;
  votes: CommitteeVoteRow[];
}

export interface CommitteeStats {
  total: number;
  averageConsensus: number;
  averageConfidence: number;
  approvalRate: number;     // (STRONG_BUY + BUY) / total
  strongBuyCount: number;
  buyCount: number;
  neutralCount: number;
  passCount: number;
  rejectCount: number;
}

export interface CommitteeGenerationResult {
  processed: number;
  generated: number;
  inserted: number;
  skipped: number;
}

/** Filters for full-text + faceted committee search. */
export interface CommitteeSearchFilters {
  finalDecision?: CommitteeDecision;
  minCommitteeScore?: number;
  maxCommitteeScore?: number;
  minConfidence?: number;
  maxConfidence?: number;
  minConsensus?: number;
  maxConsensus?: number;
  opportunityId?: Uuid;
  query?: string;
  limit?: number;
  offset?: number;
  orderBy?: "committee_score" | "confidence" | "consensus" | "created_at";
  ascending?: boolean;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/**
 * Convert weighted agent score into a final decision bucket.
 * Bucket ranges are tuned to match the agent_score → decision heuristic.
 */
export function bucketDecisionByScore(weightedScore: number): CommitteeDecision {
  if (weightedScore >= 85) return "STRONG_BUY";
  if (weightedScore >= 70) return "BUY";
  if (weightedScore >= 50) return "NEUTRAL";
  if (weightedScore >= 30) return "PASS";
  return "REJECT";
}

/**
 * Map a single agent's vote to a numeric weight for consensus calc.
 */
export function voteToNumeric(vote: CommitteeVoteValue): number {
  switch (vote) {
    case "STRONG_BUY":
      return 100;
    case "BUY":
      return 75;
    case "NEUTRAL":
      return 50;
    case "PASS":
      return 25;
    case "REJECT":
    default:
      return 0;
  }
}
