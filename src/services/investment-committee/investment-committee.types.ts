/**
 * Sprint 67: Investment Committee Types
 *
 * Types for investment_committees + committee_votes tables.
 * Replaces Sprint 61 types with new structure.
 */
import type { Uuid } from "@/types";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const AGENT_NAMES = [
  "MARKET_ANALYST",
  "PRODUCT_PARTNER",
  "FINANCIAL_PARTNER",
  "TECHNICAL_PARTNER",
  "VC_PARTNER",
] as const;

export type AgentName = (typeof AGENT_NAMES)[number];

export const AGENT_VOTES = ["BUY", "WATCH", "PASS"] as const;
export type AgentVoteValue = (typeof AGENT_VOTES)[number];

export const FINAL_DECISIONS = ["Strong Buy", "Buy", "Watch", "Reject"] as const;
export type FinalDecision = (typeof FINAL_DECISIONS)[number];

// ---------------------------------------------------------------------------
// Agent profiles
// ---------------------------------------------------------------------------

export interface AgentProfile {
  name: AgentName;
  role: string;
  focus: readonly string[];
  weight: number;
}

export const AGENT_PROFILES: readonly AgentProfile[] = [
  {
    name: "MARKET_ANALYST",
    role: "Market Analyst",
    focus: ["Market Size", "Demand", "Growth", "Timing"],
    weight: 1.0,
  },
  {
    name: "PRODUCT_PARTNER",
    role: "Product Partner",
    focus: ["Pain", "Solution", "Differentiation", "Execution"],
    weight: 1.0,
  },
  {
    name: "FINANCIAL_PARTNER",
    role: "Financial Partner",
    focus: ["Revenue", "Margins", "ROI", "Capital Efficiency"],
    weight: 1.0,
  },
  {
    name: "TECHNICAL_PARTNER",
    role: "Technical Partner",
    focus: ["Complexity", "Engineering Risk", "AI Feasibility", "Infrastructure"],
    weight: 1.0,
  },
  {
    name: "VC_PARTNER",
    role: "VC Partner",
    focus: ["Fundability", "Exit", "Moat", "Long-term Investment Quality"],
    weight: 1.0,
  },
] as const;

// ---------------------------------------------------------------------------
// AI provider output
// ---------------------------------------------------------------------------

export interface AgentVoteOutput {
  agent_name: AgentName;
  agent_role: string;
  vote: AgentVoteValue;
  score: number;       // 0–100
  confidence: number;  // 0–100
  pros: string[];
  cons: string[];
  reasoning: string;
}

export type AgentVoteContext = CommitteeVoteContext;

export interface CommitteeVoteContext {
  opportunity: {
    title: string;
    description: string;
    score: number;
    cluster_size: number | null;
    severity: number;
    buying_intent: number;
  };
  validation?: {
    score: number;
    reasoning: string;
  } | null;
  forecast?: {
    forecast_score: number;
    growth_rate: number;
    confidence: number;
  } | null;
  venture_score?: {
    overall_score: number;
    investment_grade: string;
    recommendation: string;
  } | null;
  financial_model?: {
    projected_arr: number;
    break_even_month: number;
    ltv_cac_ratio: number;
    burn_rate: number;
  } | null;
  research?: {
    completeness: number;
    sources_count: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Database rows
// ---------------------------------------------------------------------------

export type InvestmentCommitteeRow = {
  id: Uuid;
  opportunity_id: Uuid;
  overall_score: string;    // numeric(5,2)
  confidence: string;       // numeric(5,2)
  majority_vote: string | null;
  minority_vote: string | null;
  final_decision: FinalDecision;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type InvestmentCommitteeInsert = {
  opportunity_id: Uuid;
  overall_score: number;
  confidence: number;
  majority_vote: string | null;
  minority_vote: string | null;
  final_decision: FinalDecision;
  summary: string | null;
};

export type CommitteeVoteRow = {
  id: Uuid;
  committee_id: Uuid;
  agent_name: string;
  agent_role: string;
  vote: AgentVoteValue;
  score: string;     // numeric(5,2)
  confidence: string;
  pros: string[];
  cons: string[];
  reasoning: string;
  created_at: string;
};

export type CommitteeVoteInsert = {
  committee_id: Uuid;
  agent_name: AgentName;
  agent_role: string;
  vote: AgentVoteValue;
  score: number;
  confidence: number;
  pros: string[];
  cons: string[];
  reasoning: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface CommitteeWithVotes {
  committee: InvestmentCommitteeRow;
  votes: CommitteeVoteRow[];
}

export interface CommitteeCardData {
  id: Uuid;
  opportunity_id: Uuid;
  opportunity_title: string;
  final_decision: FinalDecision;
  overall_score: number;
  confidence: number;
  majority_vote: string | null;
  minority_vote: string | null;
  votes_count: number;
  created_at: string;
}

export interface CommitteeDashboardStats {
  total: number;
  averageScore: number;
  averageConfidence: number;
  strongBuyCount: number;
  buyCount: number;
  watchCount: number;
  rejectCount: number;
  approvalRate: number;
  topScore: number;
}

export interface CommitteeGenerationResult {
  processed: number;
  inserted: number;
  skipped: number;
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

export function computeOverallScore(votes: AgentVoteOutput[]): number {
  const totalWeight = votes.reduce((sum, v) => sum + (AGENT_PROFILES.find(p => p.name === v.agent_name)?.weight ?? 1.0), 0);
  const weightedSum = votes.reduce((sum, v) => {
    const weight = AGENT_PROFILES.find(p => p.name === v.agent_name)?.weight ?? 1.0;
    return sum + v.score * weight;
  }, 0);
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
}

export function computeConfidence(votes: AgentVoteOutput[]): number {
  if (votes.length === 0) return 0;
  const avg = votes.reduce((s, v) => s + v.confidence, 0) / votes.length;
  const disagreement = computeDisagreement(votes);
  return Math.max(0, Math.round((avg - disagreement * 0.3) * 100) / 100);
}

export function computeDisagreement(votes: AgentVoteOutput[]): number {
  if (votes.length <= 1) return 0;
  const avg = votes.reduce((s, v) => s + v.score, 0) / votes.length;
  const variance = votes.reduce((s, v) => s + Math.pow(v.score - avg, 2), 0) / votes.length;
  return Math.sqrt(variance);
}

export function aggregateVotes(votes: AgentVoteOutput[]): {
  majorityVote: AgentVoteValue | null;
  minorityVote: AgentVoteValue | null;
  finalDecision: FinalDecision;
  voteCounts: Record<AgentVoteValue, number>;
} {
  const counts: Record<AgentVoteValue, number> = { BUY: 0, WATCH: 0, PASS: 0 };
  for (const v of votes) counts[v.vote]++;

  const sorted = (Object.entries(counts) as [AgentVoteValue, number][])
    .sort((a, b) => b[1] - a[1]);

  const majorityVote = sorted[0][1] > 0 ? sorted[0][0] : null;
  const minorityVote = sorted.filter(([, c]) => c > 0).at(-1)?.[0] ?? null;

  const avgScore = votes.length > 0
    ? votes.reduce((s, v) => s + v.score, 0) / votes.length
    : 0;

  let finalDecision: FinalDecision;
  if (avgScore >= 75) finalDecision = "Strong Buy";
  else if (avgScore >= 60) finalDecision = "Buy";
  else if (avgScore >= 40) finalDecision = "Watch";
  else finalDecision = "Reject";

  return { majorityVote, minorityVote, finalDecision, voteCounts: counts };
}

export function generateSummary(votes: AgentVoteOutput[], finalDecision: FinalDecision, disagreement: number): string {
  const buyCount = votes.filter(v => v.vote === "BUY").length;
  const watchCount = votes.filter(v => v.vote === "WATCH").length;
  const passCount = votes.filter(v => v.vote === "PASS").length;

  const parts: string[] = [];
  if (buyCount >= 4) parts.push(`${buyCount}/5 agents voted BUY.`);
  else if (buyCount >= 3) parts.push(`Majority (${buyCount}/5) voted BUY.`);
  if (watchCount >= 2) parts.push(`${watchCount} agents voted WATCH.`);
  if (passCount >= 2) parts.push(`${passCount} agents voted PASS — concerns raised.`);
  if (disagreement > 20) parts.push(`High disagreement (σ=${disagreement.toFixed(1)}).`);

  parts.push(`Committee decision: ${finalDecision}.`);
  return parts.join(" ");
}