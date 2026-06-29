/**
 * Sprint 54: Opportunity Forecast Engine
 *
 * Types for opportunity_forecasts table.
 * AI returns business data only — no UUIDs, no foreign keys.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only)
// ---------------------------------------------------------------------------

export interface ForecastInput {
  forecast_score: number; // 0-100
  growth_probability: number; // 0-100 (percentage)
  confidence: number; // 0-100
  momentum: number; // 0-100
  prediction_summary: string;
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type OpportunityForecastRow = {
  id: Uuid;
  opportunity_id: Uuid;
  forecast_score: number;
  growth_probability: number;
  confidence: number;
  momentum: number;
  prediction_summary: string | null;
  forecast_window_days: number;
  created_at: string;
};

export type OpportunityForecastInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  forecast_score: number;
  growth_probability: number;
  confidence: number;
  momentum: number;
  prediction_summary?: string | null;
  forecast_window_days?: number;
  created_at?: string;
};

export type OpportunityForecastUpdate = Partial<OpportunityForecastInsert>;

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface ForecastStats {
  total: number;
  averageForecastScore: number;
  averageGrowthProbability: number;
  averageConfidence: number;
  averageMomentum: number;
  topForecastScore: number;
}

export interface ForecastGenerationResult {
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}