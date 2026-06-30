/**
 * Zod schemas for AI provider responses
 * Provides type-safe validation for GPT/Gemini outputs
 */

import { z } from "zod";

/**
 * Schema for pain point extraction response
 * Used when extracting pain points from raw posts
 */
export const PainPointSchema = z.object({
  pain: z.string(),
  category: z.string(),
  severity: z.number(),
  buying_intent: z.number(),
});

export type PainPointResponse = z.infer<typeof PainPointSchema>;

/**
 * Schema for pain point clustering response
 * Used when grouping similar pain points
 */
export const ClusterSchema = z.object({
  cluster_name: z.string(),
  description: z.string(),
});

export type ClusterResponse = z.infer<typeof ClusterSchema>;

/**
 * Schema for opportunity generation response
 */
export const OpportunitySchema = z.object({
  score: z.number(),
  frequency: z.number(),
  severity: z.number(),
  buying_intent: z.number(),
});

export type OpportunityResponse = z.infer<typeof OpportunitySchema>;

/**
 * Schema for opportunity insight response (Sprint 46).
 * Used when AI provider generates business insights for opportunities.
 */
export const OpportunityInsightSchema = z.object({
  summary: z.string(),
  market_size: z.string(),
  competition_level: z.enum(["Low", "Medium", "High"]),
  urgency: z.enum(["Low", "Medium", "High"]),
  recommended_mvp: z.string(),
  recommended_channels: z.string(),
  confidence_score: z.number(),
});

export type OpportunityInsightResponseItem = z.infer<typeof OpportunityInsightSchema>;

/**
 * Schema for startup idea generation response
 * Used when generating startup ideas from opportunities
 */
export const StartupIdeaSchema = z.object({
  problem: z.string(),
  solution: z.string(),
  mvp: z.string(),
  pricing: z.string(),
  customer: z.string(),
  distribution: z.string(),
  competitors: z.string(),
});

export type StartupIdeaResponse = z.infer<typeof StartupIdeaSchema>;

/**
 * Schema for opportunity validation response (Sprint 52).
 * AI validates opportunities across 4 dimensions.
 */
export const ValidationSchema = z.object({
  market_demand: z.number().min(0).max(100),
  competition: z.number().min(0).max(100),
  monetization: z.number().min(0).max(100),
  build_difficulty: z.number().min(0).max(100),
  validation_score: z.number().min(0).max(100),
  reasoning: z.string(),
});

export type ValidationResponseItem = z.infer<typeof ValidationSchema>;

/**
 * Schema for market evidence generation response (Sprint 53).
 * AI returns business data only — no UUIDs, no foreign keys.
 */
export const EvidenceSchema = z.object({
  evidence_type: z.enum(["reddit", "google_trend", "competitor", "market_report", "pricing", "customer_quote"]),
  source: z.string(),
  title: z.string(),
  url: z.string().optional(),
  summary: z.string(),
  confidence: z.number().min(0).max(100),
});

export const MarketEvidenceResponseSchema = z.object({
  results: z.array(EvidenceSchema),
});

export type EvidenceResponseItem = z.infer<typeof EvidenceSchema>;

/**
 * Schema for opportunity forecast response (Sprint 54).
 * AI returns business data only — no UUIDs, no foreign keys.
 */
export const ForecastSchema = z.object({
  forecast_score: z.number().min(0).max(100),
  growth_probability: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  momentum: z.number().min(0).max(100),
  prediction_summary: z.string(),
});

export type ForecastResponseItem = z.infer<typeof ForecastSchema>;

/**
 * Schema for market intelligence response (Sprint 55).
 * AI returns business data only — no UUIDs, no foreign keys.
 */
export const MarketIntelligenceSchema = z.object({
  reddit_score: z.number().min(0).max(100),
  github_score: z.number().min(0).max(100),
  product_hunt_score: z.number().min(0).max(100),
  news_score: z.number().min(0).max(100),
  google_trends_score: z.number().min(0).max(100),
  jobs_score: z.number().min(0).max(100),
  overall_score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
});

export type MarketIntelligenceResponseItem = z.infer<typeof MarketIntelligenceSchema>;

/**
 * Schema for VC-style investment scoring response (Sprint 56).
 * AI returns business data only — no UUIDs, no foreign keys.
 */
export const StartupScoreSchema = z.object({
  tam_score: z.number().min(0).max(100),
  market_timing_score: z.number().min(0).max(100),
  competition_score: z.number().min(0).max(100),
  moat_score: z.number().min(0).max(100),
  distribution_score: z.number().min(0).max(100),
  execution_score: z.number().min(0).max(100),
  capital_efficiency_score: z.number().min(0).max(100),
  overall_score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  recommendation: z.string(),
  summary: z.string(),
});

export type StartupScoreResponseItem = z.infer<typeof StartupScoreSchema>;

/**
 * Schema for Investment Memo generation response (Sprint 58).
 * AI returns business data only — no UUIDs, no foreign keys.
 *
 * Mirrors internal memos used by Y Combinator, Sequoia, a16z, Accel:
 * concise, decision-oriented, investor-friendly language.
 */
export const InvestmentMemoSchema = z.object({
  title: z.string(),
  thesis: z.string(),
  market: z.string(),
  problem: z.string(),
  solution: z.string(),
  business_model: z.string(),
  traction: z.string(),
  competition: z.string(),
  risks: z.string(),
  strengths: z.string(),
  why_now: z.string(),
  investment_decision: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(100),
});

export type InvestmentMemoResponseItem = z.infer<typeof InvestmentMemoSchema>;

/**
 * Schema for Venture Research Report generation response (Sprint 57).
 * AI returns business data only — no UUIDs, no foreign keys.
 */
export const VentureReportSchema = z.object({
  title: z.string(),
  executive_summary: z.string(),
  problem: z.string(),
  market_analysis: z.string(),
  tam_analysis: z.string(),
  competition_analysis: z.string(),
  customer_segments: z.string(),
  business_model: z.string(),
  pricing_strategy: z.string(),
  go_to_market: z.string(),
  distribution_strategy: z.string(),
  product_roadmap: z.string(),
  technical_risks: z.string(),
  business_risks: z.string(),
  competitive_advantages: z.string(),
  moat_analysis: z.string(),
  financial_outlook: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(100),
});

export type VentureReportResponseItem = z.infer<typeof VentureReportSchema>;

/**
 * Schema for backtest evaluation response (Sprint 59).
 * AI returns business data only — no UUIDs, no foreign keys.
 */
export const BacktestEvaluationSchema = z.object({
  actual_score: z.number().min(0).max(100),
  prediction_delta: z.number(),
  accuracy: z.number().min(0).max(100),
  notes: z.string(),
});

export type BacktestEvaluationResponseItem = z.infer<typeof BacktestEvaluationSchema>;
