/**
 * Sprint 59: Opportunity Backtesting Engine
 *
 * Types for opportunity_backtests table.
 * Tracks historical accuracy of investment predictions.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type BacktestStatus = "pending" | "evaluated" | "failed" | "stale";

export type PredictionDirection = "up" | "down" | "stable";

/** Row type for opportunity_backtests table. */
export type BacktestRow = {
  id: Uuid;
  opportunity_id: Uuid;
  predicted_score: string;   // Decimal6
  predicted_direction: PredictionDirection | null;
  actual_score: string | null;        // Decimal6, null when pending
  prediction_delta: string | null;   // Decimal6
  market_growth: string | null;       // Decimal3
  search_growth: string | null;
  reddit_growth: string | null;
  github_growth: string | null;
  competitor_growth: string | null;
  accuracy: string | null;           // Decimal5, 0-100
  status: BacktestStatus;
  evaluation_date: string;           // date (YYYY-MM-DD)
  notes: string | null;
  created_at: string;
};

/** Insert type for creating backtest records. */
export type BacktestInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  predicted_score: string;
  predicted_direction?: PredictionDirection | null;
  actual_score?: string | null;
  prediction_delta?: string | null;
  market_growth?: string | null;
  search_growth?: string | null;
  reddit_growth?: string | null;
  github_growth?: string | null;
  competitor_growth?: string | null;
  accuracy?: string | null;
  status?: BacktestStatus;
  evaluation_date: string;
  notes?: string | null;
  created_at?: string;
};

/** Update type for patching backtest records. */
export type BacktestUpdate = {
  actual_score?: string | null;
  prediction_delta?: string | null;
  market_growth?: string | null;
  search_growth?: string | null;
  reddit_growth?: string | null;
  github_growth?: string | null;
  competitor_growth?: string | null;
  accuracy?: string | null;
  status?: BacktestStatus;
  notes?: string | null;
};

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only)
// ---------------------------------------------------------------------------

/**
 * Input for AI-assisted backtest evaluation.
 * AI returns actual_score and notes only — no UUIDs, no FKs.
 */
export interface BacktestInput {
  opportunity_id: string;
  predicted_score: number;
  predicted_direction: PredictionDirection;
  /** Days since the opportunity was first scored */
  days_elapsed: number;
  /** Current market signal growth (from market_intelligence) */
  market_growth: number | null;
  search_growth: number | null;
  reddit_growth: number | null;
  github_growth: number | null;
  /** Current competitor activity score */
  competitor_growth: number | null;
  /** Current opportunity score */
  current_score: number;
  /** Trend over the evaluation window */
  score_trend: number;   // positive = trending up, negative = down
}

/**
 * Output from AI provider for backtest evaluation.
 */
export interface BacktestEvaluation {
  actual_score: number;
  prediction_delta: number;
  accuracy: number;       // 0-100
  notes: string;
}

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

/**
 * Card data for dashboard listing.
 */
export interface BacktestCard {
  id: Uuid;
  opportunity_id: Uuid;
  opportunity_title: string;
  cluster_name: string | null;
  predicted_score: number;
  actual_score: number | null;
  prediction_delta: number | null;
  accuracy: number | null;
  status: BacktestStatus;
  evaluation_date: string;
  created_at: string;
}

/**
 * Aggregated backtest statistics.
 */
export interface BacktestStats {
  total: number;
  evaluated: number;
  pending: number;
  averageAccuracy: number | null;   // 0-100, null when no evaluations
  averageDelta: number | null;      // absolute prediction error
  successfulPredictions: number;    // accuracy >= 60
  failedPredictions: number;        // accuracy < 40
  bestAccuracy: number | null;     // highest accuracy record
  worstAccuracy: number | null;    // lowest accuracy record
  latestEvaluationDate: string | null;
}

/**
 * Batch evaluation result.
 */
export interface BacktestEvaluationResult {
  processed: number;
  evaluated: number;
  skipped: number;
  inserted: number;
  updated: number;
}

/**
 * Accuracy distribution for admin dashboard.
 */
export interface BacktestAccuracyDistribution {
  range: string;    // e.g. "90-100", "80-90"
  count: number;
}

/**
 * Filters for backtest list/search.
 */
export interface BacktestSearchFilters {
  query?: string;
  status?: BacktestStatus;
  minAccuracy?: number;
  maxAccuracy?: number;
  minDelta?: number;
  maxDelta?: number;
  limit?: number;
  offset?: number;
  orderBy?: "accuracy" | "evaluation_date" | "created_at" | "prediction_delta";
  ascending?: boolean;
}