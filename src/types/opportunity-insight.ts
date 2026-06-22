/**
 * Sprint 46: AI Opportunity Insight types.
 *
 * Three layers:
 *   - `OpportunityInsightRow`        — DB row (Database source of truth)
 *   - `OpportunityInsightInsert`     — POST payload to create a row
 *   - `OpportunityInsightCardData`   — UI view shape consumed by cards
 *
 * AI layer types live with OpenAI provider (`OpportunityInsightInput`)
 * and contain NO ids / NO foreign keys, per the existing pipeline rule.
 */

import type { Uuid } from "./database.types";
import type { OpportunityInput } from "./pipeline";

export type CompetitionLevel = "Low" | "Medium" | "High";
export type Urgency = "Low" | "Medium" | "High";

export const COMPETITION_LEVELS: ReadonlyArray<CompetitionLevel> = ["Low", "Medium", "High"];
export const URGENCY_LEVELS: ReadonlyArray<Urgency> = ["Low", "Medium", "High"];

/**
 * AI-generated business insight for one opportunity.
 * No `id`. No `opportunity_id`. Pure business data per architecture rules.
 */
export interface OpportunityInsightInput {
  summary: string;
  market_size: string;
  competition_level: CompetitionLevel;
  urgency: Urgency;
  recommended_mvp: string;
  recommended_channels: string;
  confidence_score: number;
}

/**
 * Row type — mirrors `opportunity_insights` table.
 */
export type OpportunityInsightRow = {
  id: Uuid;
  opportunity_id: Uuid;
  summary: string;
  market_size: string;
  competition_level: CompetitionLevel;
  urgency: Urgency;
  recommended_mvp: string;
  recommended_channels: string;
  confidence_score: number;
  created_at: string;
};

/**
 * Insert type — used when creating an insight row.
 */
export type OpportunityInsightInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  summary: string;
  market_size: string;
  competition_level: CompetitionLevel;
  urgency: Urgency;
  recommended_mvp: string;
  recommended_channels: string;
  confidence_score: number;
  created_at?: string;
};

/**
 * View shape used by cards/lists/dashboard. Joins the parent's cluster
 * info so the UI can show context without a second query.
 */
export interface OpportunityInsightCardData {
  id: Uuid;
  opportunity_id: Uuid;
  summary: string;
  market_size: string;
  competition_level: CompetitionLevel;
  urgency: Urgency;
  recommended_mvp: string;
  recommended_channels: string;
  confidence_score: number;
  created_at: string;
  opportunity_title: string;
  opportunity_score: number;
}

/**
 * Filters used by `/insights` history page and opportunity filter panel.
 */
export interface OpportunityInsightFilters {
  competition_level?: CompetitionLevel;
  urgency?: Urgency;
  minConfidence?: number;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "confidence_score";
  order?: "asc" | "desc";
}

/**
 * Enriched input the AI provider actually needs.
 * Re-exporting `OpportunityInput` keeps the public surface stable.
 */
export type { OpportunityInput };
