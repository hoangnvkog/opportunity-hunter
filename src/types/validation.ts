/**
 * Sprint 52: Opportunity Validation Engine (AI-powered)
 *
 * Types for AI-powered opportunity validation.
 * Validates each opportunity across 4 dimensions:
 * - Market Demand  (0-100)
 * - Competition     (0-100)
 * - Monetization   (0-100)
 * - Build Difficulty (0-100)
 *
 * Overall validation_score = weighted average.
 */

import type { Decimal6, Uuid } from ".";

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only, no UUIDs)
// ---------------------------------------------------------------------------

export interface OpportunityValidationInput {
  market_demand: number;      // 0-100
  competition: number;        // 0-100
  monetization: number;       // 0-100
  build_difficulty: number;   // 0-100
  validation_score: number;   // 0-100, calculated
  reasoning: string;          // AI explanation
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type OpportunityValidationRow = {
  id: Uuid;
  opportunity_id: Uuid;
  market_demand: Decimal6;
  competition: Decimal6;
  monetization: Decimal6;
  build_difficulty: Decimal6;
  validation_score: Decimal6;
  reasoning: string | null;
  created_at: string;
};

export type OpportunityValidationInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  market_demand: Decimal6;
  competition: Decimal6;
  monetization: Decimal6;
  build_difficulty: Decimal6;
  validation_score: Decimal6;
  reasoning?: string | null;
  created_at?: string;
};

export type OpportunityValidationUpdate = Partial<
  Omit<OpportunityValidationInsert, "id" | "opportunity_id">
>;

// ---------------------------------------------------------------------------
// Service result type
// ---------------------------------------------------------------------------

export interface ValidationResult {
  processed: number;
  validated: number;
  inserted: number;
  skipped: number;
}