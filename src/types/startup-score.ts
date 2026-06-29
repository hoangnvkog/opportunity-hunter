/**
 * Sprint 56: Startup Investment Scoring Engine
 *
 * Types for startup_scores table.
 * AI returns business data only — no UUIDs, no foreign keys.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// Scoring dimensions (7 axes + overall + confidence + rec/summary)
// ---------------------------------------------------------------------------

export type StartupScoreDimension =
  | "tam_score"
  | "market_timing_score"
  | "competition_score"
  | "moat_score"
  | "distribution_score"
  | "execution_score"
  | "capital_efficiency_score";

export const STARTUP_SCORE_DIMENSIONS: ReadonlyArray<StartupScoreDimension> = [
  "tam_score",
  "market_timing_score",
  "competition_score",
  "moat_score",
  "distribution_score",
  "execution_score",
  "capital_efficiency_score",
] as const;

export const STARTUP_SCORE_LABELS: Readonly<Record<StartupScoreDimension, string>> = {
  tam_score: "TAM",
  market_timing_score: "Market Timing",
  competition_score: "Competition",
  moat_score: "Moat",
  distribution_score: "Distribution",
  execution_score: "Execution",
  capital_efficiency_score: "Capital Efficiency",
};

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only)
// ---------------------------------------------------------------------------

export interface StartupScoreInput {
  tam_score: number;                  // 0-100
  market_timing_score: number;        // 0-100
  competition_score: number;          // 0-100
  moat_score: number;                 // 0-100
  distribution_score: number;         // 0-100
  execution_score: number;            // 0-100
  capital_efficiency_score: number;   // 0-100
  overall_score: number;              // 0-100
  confidence: number;                 // 0-100
  recommendation: string;             // "Strong Invest" | "Watch" | "Pass"
  summary: string;
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type StartupScoreRow = {
  id: Uuid;
  opportunity_id: Uuid;
  tam_score: number;
  market_timing_score: number;
  competition_score: number;
  moat_score: number;
  distribution_score: number;
  execution_score: number;
  capital_efficiency_score: number;
  overall_score: number;
  confidence: number;
  recommendation: string | null;
  summary: string | null;
  created_at: string;
};

export type StartupScoreInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  tam_score: number;
  market_timing_score: number;
  competition_score: number;
  moat_score: number;
  distribution_score: number;
  execution_score: number;
  capital_efficiency_score: number;
  overall_score: number;
  confidence: number;
  recommendation?: string | null;
  summary?: string | null;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface StartupScoreStats {
  total: number;
  averageOverallScore: number;
  highestOverallScore: number;
  investmentGradeCount: number;     // overall_score >= 90
  averageConfidence: number;
  averageTamScore: number;
  averageMarketTimingScore: number;
  averageCompetitionScore: number;
  averageMoatScore: number;
  averageDistributionScore: number;
  averageExecutionScore: number;
  averageCapitalEfficiencyScore: number;
}

export interface StartupScoreGenerationResult {
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}

export interface StartupScoreCardData {
  id: Uuid;
  opportunity_id: Uuid;
  opportunity_title: string;
  cluster_name: string | null;
  tam_score: number;
  market_timing_score: number;
  competition_score: number;
  moat_score: number;
  distribution_score: number;
  execution_score: number;
  capital_efficiency_score: number;
  overall_score: number;
  confidence: number;
  recommendation: string | null;
  summary: string | null;
  created_at: string;
}

export interface StartupScoreDimensionPoint {
  dimension: StartupScoreDimension;
  label: string;
  value: number;
}