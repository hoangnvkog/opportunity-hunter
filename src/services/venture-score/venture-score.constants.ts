/**
 * Sprint 66: AI Venture Score Engine — Constants
 *
 * Configurable weights, scoring thresholds, and explanation rules.
 * Keep this file as the single source of truth for tunable parameters.
 */

import type { InvestmentGrade, VentureRecommendation } from "@/types/venture-score";

// ---------------------------------------------------------------------------
// Component weights (must sum to 100)
// ---------------------------------------------------------------------------
export const VENTURE_SCORE_WEIGHTS = {
  validation: 20,
  financial: 20,
  forecast: 15,
  research: 15,
  competition: 10,
  execution: 10,
  innovation: 5,
  historicalSimilarity: 5,
} as const;

export const VENTURE_SCORE_WEIGHT_SUM =
  VENTURE_SCORE_WEIGHTS.validation +
  VENTURE_SCORE_WEIGHTS.financial +
  VENTURE_SCORE_WEIGHTS.forecast +
  VENTURE_SCORE_WEIGHTS.research +
  VENTURE_SCORE_WEIGHTS.competition +
  VENTURE_SCORE_WEIGHTS.execution +
  VENTURE_SCORE_WEIGHTS.innovation +
  VENTURE_SCORE_WEIGHTS.historicalSimilarity;

assert(VENTURE_SCORE_WEIGHT_SUM === 100, "VENTURE_SCORE_WEIGHTS must sum to 100");

// ---------------------------------------------------------------------------
// Investment grade boundaries (descending)
// ---------------------------------------------------------------------------
export const INVESTMENT_GRADE_RULES: Array<{
  min: number;
  grade: InvestmentGrade;
}> = [
  { min: 95, grade: "AAA" },
  { min: 90, grade: "AA" },
  { min: 85, grade: "A" },
  { min: 80, grade: "BBB" },
  { min: 70, grade: "BB" },
  { min: 60, grade: "B" },
  { min: 0, grade: "Reject" },
];

// ---------------------------------------------------------------------------
// Recommendation rules (deterministic, derived from overall + confidence + risk)
// ---------------------------------------------------------------------------
export const RECOMMENDATION_RULES = {
  strongBuy: { minOverall: 85, minConfidence: 75, maxRisk: 25 },
  buy: { minOverall: 80, minConfidence: 65 },
  watch: { minOverall: 70 },
  speculative: { minOverall: 50 },
  reject: { minOverall: 0 },
} as const;

// ---------------------------------------------------------------------------
// Confidence weights — how much each signal adds to the aggregate confidence.
// Missing modules make confidence lower.
// ---------------------------------------------------------------------------
export const CONFIDENCE_WEIGHTS = {
  validation: 25,
  forecast: 15,
  financial: 20,
  research: 15,
  competition: 10,
  portfolioBacktesting: 10,
  insights: 5,
} as const;

export const CONFIDENCE_WEIGHT_SUM = Object.values(CONFIDENCE_WEIGHTS).reduce(
  (a, b) => a + b,
  0,
);
assert(CONFIDENCE_WEIGHT_SUM === 100, "CONFIDENCE_WEIGHTS must sum to 100");

// ---------------------------------------------------------------------------
// Defaults when modules are missing
// ---------------------------------------------------------------------------
export const FALLBACK_SCORES = {
  missingValidation: 50,
  missingForecast: 50,
  missingFinancial: 30,
  missingResearch: 40,
  missingCompetition: 50,
  missingPortfolio: 50,
  missingBacktesting: 50,
  missingInsights: 50,
} as const;

// ---------------------------------------------------------------------------
// Legacy migration recommendation supply
// ---------------------------------------------------------------------------
export const INVESTMENT_GRADES: InvestmentGrade[] = [
  "AAA",
  "AA",
  "A",
  "BBB",
  "BB",
  "B",
  "Reject",
];

export const VENTURE_RECOMMENDATIONS: VentureRecommendation[] = [
  "Strong Buy",
  "Buy",
  "Watch",
  "Speculative",
  "Reject",
];

// ---------------------------------------------------------------------------
// Strength / weakness thresholds — used to drive explanation engine.
// ---------------------------------------------------------------------------
export const EXPLANATION_RULES = {
  monetizationThreshold: 65, // roi_score ≥
  tamThreshold: 60, // market_score ≥
  validationThreshold: 70, // validation_score ≥
  innovationThreshold: 60, // innovation_score ≥
  confidenceThreshold: 60,
  competitionCrowdedMax: 40, // competition_score ≤ ⇒ crowded market
  paybackLongMonths: 36, // break_even_months ≥ ⇒ long payback
  executionComplexityScore: 40, // execution_score ≤ ⇒ hard to ship
} as const;

// runtime sanity — fail fast on weight misconfiguration
function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`[venture-score.constants] ${msg}`);
}
