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

/**
 * Schema for AI Investment Committee vote (Sprint 61).
 * AI returns votes from ALL five agents in a single call — no UUIDs, no FKs.
 */
export const CommitteeAgentVoteSchema = z.object({
  agent_name: z.enum(["MARKET_ANALYST", "TECHNICAL_PARTNER", "FOUNDER_PARTNER", "INVESTMENT_PARTNER", "RISK_PARTNER"]),
  agent_role: z.string(),
  vote: z.enum(["STRONG_BUY", "BUY", "NEUTRAL", "PASS", "REJECT"]),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  weight: z.number().min(0).max(5),
});

export type CommitteeAgentVoteResponseItem = z.infer<typeof CommitteeAgentVoteSchema>;

export const CommitteeVoteResponseSchema = z.array(CommitteeAgentVoteSchema);

/**
 * Schema for Venture Studio Canvas generation (Sprint 63).
 * AI returns business data only — no UUIDs, no foreign keys.
 */
export const VentureCanvasSchema = z.object({
  problem: z.string(),
  solution: z.string(),
  value_proposition: z.string(),
  customer_segments: z.string(),
  channels: z.string(),
  customer_relationships: z.string(),
  key_activities: z.string(),
  key_resources: z.string(),
  key_partners: z.string(),
  cost_structure: z.string(),
  revenue_streams: z.string(),
});

export type VentureCanvasResponseItem = z.infer<typeof VentureCanvasSchema>;

/**
 * Schema for Venture Studio GTM generation (Sprint 63).
 * AI returns business data only — no UUIDs, no foreign keys.
 */
export const VentureGtmSchema = z.object({
  launch_strategy: z.string(),
  acquisition_channels: z.string(),
  pricing_strategy: z.string(),
  growth_loops: z.string(),
  marketing_plan: z.string(),
  sales_plan: z.string(),
});

export type VentureGtmResponseItem = z.infer<typeof VentureGtmSchema>;

/**
 * Schema for Venture Studio MVP generation (Sprint 63).
 * AI returns business data only — no UUIDs, no foreign keys.
 */
export const VentureMvpSchema = z.object({
  core_features: z.string(),
  roadmap: z.string(),
  tech_stack: z.string(),
  estimated_cost: z.string(),
  estimated_time: z.string(),
  risks: z.string(),
});

export type VentureMvpResponseItem = z.infer<typeof VentureMvpSchema>;

/**
 * Schema for full Venture Project generation (Sprint 63).
 * AI returns all venture studio content in a single call.
 */
export const VentureProjectSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  overall_score: z.number(),
  canvas: VentureCanvasSchema,
  gtm: VentureGtmSchema,
  mvp: VentureMvpSchema,
});

export type VentureProjectResponseItem = z.infer<typeof VentureProjectSchema>;

// ── Sprint 64: Financial Projection Engine ─────────────────────────────────────

export const FinancialAssumptionsSchema = z.object({
  averagePrice: z.number(),
  conversionRate: z.number(),
  monthlyGrowthRate: z.number(),
  churnRate: z.number(),
  grossMargin: z.number(),
  cac: z.number(),
  supportCost: z.number(),
  hostingCost: z.number(),
  payroll: z.number(),
  marketingBudget: z.number(),
  salesCost: z.number(),
  infrastructure: z.number(),
});

export const FinancialProjectionItemSchema = z.object({
  year: z.number(),
  revenue: z.number(),
  cogs: z.number(),
  grossProfit: z.number(),
  operatingExpenses: z.number(),
  ebitda: z.number(),
  netProfit: z.number(),
  cashBalance: z.number(),
});

export const UnitEconomicsItemSchema = z.object({
  cac: z.number(),
  ltv: z.number(),
  ltvCacRatio: z.number(),
  paybackMonths: z.number(),
  grossMargin: z.number(),
  arpu: z.number(),
  monthlyChurn: z.number(),
});

export const BreakEvenItemSchema = z.object({
  monthlyFixedCost: z.number(),
  grossMargin: z.number(),
  breakEvenRevenue: z.number(),
  breakEvenCustomers: z.number(),
  estimatedBreakEvenMonth: z.number(),
});

export const InvestmentRecommendationSchema = z.object({
  stage: z.string(),
  recommended: z.boolean(),
  reasoning: z.string(),
});

export const RiskAssessmentSchema = z.object({
  category: z.string(),
  level: z.string(),
  score: z.number(),
  reasoning: z.string(),
});

export const FinancialModelSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  currency: z.string(),
  projectionYears: z.number(),
  assumptions: FinancialAssumptionsSchema,
  projections: z.array(FinancialProjectionItemSchema),
  unitEconomics: UnitEconomicsItemSchema,
  breakEven: BreakEvenItemSchema,
  investmentRecommendation: InvestmentRecommendationSchema,
  risks: z.array(RiskAssessmentSchema),
  summary: z.string(),
  runwayMonths: z.number(),
  breakEvenMonth: z.number(),
  projectedARR: z.number(),
});

export type FinancialModelResponseItem = z.infer<typeof FinancialModelSchema>;
