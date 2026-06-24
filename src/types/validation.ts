/**
 * Sprint 51: Opportunity Validation Engine v1
 *
 * Types for the validation system.
 * The validation score is independent from the AI opportunity score
 * and answers: "Which opportunity is actually worth building?"
 */

import type { Decimal6, Uuid } from ".";

// ---------------------------------------------------------------------------
// Validation result (computed by the service layer)
// ---------------------------------------------------------------------------

/**
 * Result of a single validation calculation.
 */
export interface ValidationResult {
  /** Overall validation score (0-100). */
  validation_score: number;
  /** Market demand sub-score (0-100). */
  market_demand: number;
  /** Pain severity sub-score (0-100). */
  pain_severity: number;
  /** Buying intent sub-score (0-100). */
  buying_intent: number;
  /** Competition risk sub-score (0-100). */
  competition_risk: number;
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type OpportunityValidationRow = {
  id: Uuid;
  opportunity_id: Uuid;
  validation_score: Decimal6;
  market_demand: Decimal6;
  pain_severity: Decimal6;
  buying_intent: Decimal6;
  competition_risk: Decimal6;
  created_at: string;
};

export type OpportunityValidationInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  validation_score: Decimal6;
  market_demand: Decimal6;
  pain_severity: Decimal6;
  buying_intent: Decimal6;
  competition_risk: Decimal6;
  created_at?: string;
};

export type OpportunityValidationUpdate = Partial<
  Omit<OpportunityValidationInsert, "id" | "opportunity_id">
>;
