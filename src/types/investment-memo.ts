/**
 * Sprint 58: Investment Memo Generator
 *
 * Types for investment_memos table.
 * AI returns business data only — no UUIDs, no foreign keys.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only)
// ---------------------------------------------------------------------------

export interface InvestmentMemoInput {
  title: string;
  thesis: string;
  market: string;
  problem: string;
  solution: string;
  business_model: string;
  traction: string;
  competition: string;
  risks: string;
  strengths: string;
  why_now: string;
  investment_decision: string;
  recommendation: string;          // "STRONG BUY" | "BUY" | "HOLD" | "PASS"
  confidence: number;              // 0-100
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type InvestmentMemoRow = {
  id: Uuid;
  opportunity_id: Uuid;
  venture_report_id: Uuid;
  investment_score_id: Uuid;
  title: string;
  thesis: string;
  market: string;
  problem: string;
  solution: string;
  business_model: string;
  traction: string;
  competition: string;
  risks: string;
  strengths: string;
  why_now: string;
  investment_decision: string;
  recommendation: string;
  confidence: number;
  memo_version: number;
  created_at: string;
};

export type InvestmentMemoInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  venture_report_id: Uuid;
  investment_score_id: Uuid;
  title: string;
  thesis: string;
  market: string;
  problem: string;
  solution: string;
  business_model: string;
  traction: string;
  competition: string;
  risks: string;
  strengths: string;
  why_now: string;
  investment_decision: string;
  recommendation: string;
  confidence: number;
  memo_version?: number;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface InvestmentMemoCardData {
  id: Uuid;
  opportunity_id: Uuid;
  opportunity_title: string;
  cluster_name: string | null;
  overall_score: number;
  confidence: number;
  recommendation: string;
  memo_version: number;
  created_at: string;
}

export interface InvestmentMemoStats {
  total: number;
  averageConfidence: number;
  strongBuyCount: number;
  investorReadyCount: number;   // recommendation == "STRONG BUY"
  latestMemoDate: string | null;
}

export interface InvestmentMemoGenerationResult {
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}

/**
 * Filters supported by full-text + faceted search.
 * All fields optional; combinations AND together.
 */
export interface InvestmentMemoSearchFilters {
  query?: string;            // full-text across title/thesis/market/problem/solution/strengths
  recommendation?: string;   // exact match (case-insensitive), e.g. "STRONG BUY"
  minConfidence?: number;    // >= threshold
  maxConfidence?: number;    // <= threshold
  investmentDecision?: string; // exact match (case-insensitive)
  limit?: number;
  offset?: number;
  orderBy?: "confidence" | "created_at" | "memo_version";
  ascending?: boolean;
}