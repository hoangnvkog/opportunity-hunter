/**
 * Sprint 55: Market Intelligence Engine
 *
 * Types for market_intelligence table.
 * AI returns business data only — no UUIDs, no foreign keys.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// Market signals (6 dimensions, 0-100 each)
// ---------------------------------------------------------------------------

export type MarketSignal =
  | "reddit_score"
  | "github_score"
  | "product_hunt_score"
  | "news_score"
  | "google_trends_score"
  | "jobs_score";

export const MARKET_SIGNALS: ReadonlyArray<MarketSignal> = [
  "reddit_score",
  "github_score",
  "product_hunt_score",
  "news_score",
  "google_trends_score",
  "jobs_score",
] as const;

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only)
// ---------------------------------------------------------------------------

export interface MarketIntelligenceInput {
  reddit_score: number;          // 0-100
  github_score: number;          // 0-100
  product_hunt_score: number;    // 0-100
  news_score: number;            // 0-100
  google_trends_score: number;   // 0-100
  jobs_score: number;            // 0-100
  overall_score: number;         // 0-100 (weighted average)
  confidence: number;            // 0-100
  summary: string;
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type MarketIntelligenceRow = {
  id: Uuid;
  opportunity_id: Uuid;
  reddit_score: number;
  github_score: number;
  product_hunt_score: number;
  news_score: number;
  google_trends_score: number;
  jobs_score: number;
  overall_score: number;
  confidence: number;
  summary: string | null;
  created_at: string;
};

export type MarketIntelligenceInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  reddit_score: number;
  github_score: number;
  product_hunt_score: number;
  news_score: number;
  google_trends_score: number;
  jobs_score: number;
  overall_score: number;
  confidence: number;
  summary?: string | null;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface MarketIntelligenceStats {
  total: number;
  averageOverallScore: number;
  highestOverallScore: number;
  averageConfidence: number;
  averageRedditScore: number;
  averageGithubScore: number;
  averageProductHuntScore: number;
  averageNewsScore: number;
  averageGoogleTrendsScore: number;
  averageJobsScore: number;
}

export interface MarketIntelligenceGenerationResult {
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}

export interface MarketIntelligenceCardData {
  id: Uuid;
  opportunity_id: Uuid;
  opportunity_title: string;
  cluster_name: string | null;
  reddit_score: number;
  github_score: number;
  product_hunt_score: number;
  news_score: number;
  google_trends_score: number;
  jobs_score: number;
  overall_score: number;
  confidence: number;
  summary: string | null;
  created_at: string;
}

export interface MarketIntelligenceSignalPoint {
  signal: MarketSignal;
  label: string;
  value: number;
}