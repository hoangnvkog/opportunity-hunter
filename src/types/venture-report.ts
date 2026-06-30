/**
 * Sprint 57: Venture Research Report Generator
 *
 * Types for venture_reports table.
 * AI returns business data only — no UUIDs, no foreign keys.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only)
// ---------------------------------------------------------------------------

export interface VentureReportInput {
  title: string;
  executive_summary: string;
  problem: string;
  market_analysis: string;
  tam_analysis: string;
  competition_analysis: string;
  customer_segments: string;
  business_model: string;
  pricing_strategy: string;
  go_to_market: string;
  distribution_strategy: string;
  product_roadmap: string;
  technical_risks: string;
  business_risks: string;
  competitive_advantages: string;
  moat_analysis: string;
  financial_outlook: string;
  recommendation: string;
  confidence: number; // 0-100
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type VentureReportRow = {
  id: Uuid;
  opportunity_id: Uuid;
  startup_score_id: Uuid;
  title: string;
  executive_summary: string;
  problem: string;
  market_analysis: string;
  tam_analysis: string;
  competition_analysis: string;
  customer_segments: string;
  business_model: string;
  pricing_strategy: string;
  go_to_market: string;
  distribution_strategy: string;
  product_roadmap: string;
  technical_risks: string;
  business_risks: string;
  competitive_advantages: string;
  moat_analysis: string;
  financial_outlook: string;
  recommendation: string;
  confidence: number;
  report_version: number;
  created_at: string;
};

export type VentureReportInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  startup_score_id: Uuid;
  title: string;
  executive_summary: string;
  problem: string;
  market_analysis: string;
  tam_analysis: string;
  competition_analysis: string;
  customer_segments: string;
  business_model: string;
  pricing_strategy: string;
  go_to_market: string;
  distribution_strategy: string;
  product_roadmap: string;
  technical_risks: string;
  business_risks: string;
  competitive_advantages: string;
  moat_analysis: string;
  financial_outlook: string;
  recommendation: string;
  confidence: number;
  report_version?: number;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface VentureReportCardData {
  id: Uuid;
  opportunity_id: Uuid;
  opportunity_title: string;
  cluster_name: string | null;
  overall_score: number;
  confidence: number;
  recommendation: string | null;
  report_version: number;
  created_at: string;
}

export interface VentureReportStats {
  total: number;
  averageConfidence: number;
  investmentGradeCount: number; // report.confidence >= 80
  strongBuyCount: number;
  latestReportDate: string | null;
}

export interface VentureReportGenerationResult {
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}