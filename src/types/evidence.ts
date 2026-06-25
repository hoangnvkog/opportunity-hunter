/**
 * Sprint 53: Market Evidence Engine
 *
 * Types for opportunity_evidence table.
 * AI returns business data only — no UUIDs, no foreign keys.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only)
// ---------------------------------------------------------------------------

export type EvidenceType =
  | "reddit"
  | "google_trend"
  | "competitor"
  | "market_report"
  | "pricing"
  | "customer_quote";

export interface EvidenceInput {
  evidence_type: EvidenceType;
  source: string;
  title: string;
  url?: string;
  summary: string;
  confidence: number; // 0-100
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type OpportunityEvidenceRow = {
  id: Uuid;
  opportunity_id: Uuid;
  evidence_type: EvidenceType;
  source: string;
  title: string;
  url: string | null;
  summary: string | null;
  confidence: number;
  created_at: string;
};

export type OpportunityEvidenceInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  evidence_type: EvidenceType;
  source: string;
  title: string;
  url?: string | null;
  summary?: string | null;
  confidence: number;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface EvidenceStats {
  total: number;
  byType: Record<EvidenceType, number>;
  averageConfidence: number;
  evidencePerOpportunity: number;
}

export interface EvidenceGenerationResult {
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}