/**
 * AI Provider types - abstraction layer for LLM integrations
 */

import type {
  RawPostInput,
  PainPointInput,
  PainClusterInput,
  OpportunityInput,
  StartupIdeaInput,
} from "./pipeline";
import type { OpportunityInsightInput } from "./opportunity-insight";
import type { OpportunityValidationInput } from "./validation";
import type { EvidenceInput } from "./evidence";
import type { ForecastInput } from "./forecast";
import type { MarketIntelligenceInput } from "./market-intelligence";
import type { StartupScoreInput } from "./startup-score";
import type { VentureReportInput } from "./venture-report";
import type { InvestmentMemoInput } from "./investment-memo";
import type { BacktestInput, BacktestEvaluation } from "./backtesting";
import type { CommitteeVoteInput } from "./committee";
import type { CommitteeAgentVote } from "./investment-committee";
import type { VentureProjectInput } from "./venture-studio";

/**
 * AI Provider interface - defines contract for all AI/LLM providers
 * Implementations: MockProvider, OpenAIProvider, GeminiProvider
 */
export interface AIProvider {
  extractPainPoints(posts: RawPostInput[]): Promise<PainPointInput[]>;
  clusterPainPoints(painPoints: PainPointInput[]): Promise<PainClusterInput[]>;
  generateOpportunities(clusters: PainClusterInput[]): Promise<OpportunityInput[]>;
  generateInsights(opportunities: OpportunityInput[]): Promise<OpportunityInsightInput[]>;
  generateStartupIdeas(opportunities: OpportunityInput[]): Promise<StartupIdeaInput[]>;
  validateOpportunities(opportunities: OpportunityInput[]): Promise<OpportunityValidationInput[]>;
  /**
   * Find market evidence for validated opportunities (Sprint 53).
   * AI returns business data only — no UUIDs, no foreign keys.
   * Each result array = evidence items for one opportunity.
   */
  findMarketEvidence(opportunities: OpportunityInput[]): Promise<EvidenceInput[][]>;
  /**
   * Forecast future opportunity growth (Sprint 54).
   * AI returns business data only — no UUIDs, no foreign keys.
   */
  forecastOpportunities(opportunities: OpportunityInput[]): Promise<ForecastInput[]>;
  /**
   * Aggregate external market signals into one intelligence score (Sprint 55).
   * AI returns business data only — no UUIDs, no foreign keys.
   */
  generateMarketIntelligence(opportunities: OpportunityInput[]): Promise<MarketIntelligenceInput[]>;
  /**
   * VC-style investment scoring (Sprint 56).
   * AI returns business data only — no UUIDs, no foreign keys.
   */
  scoreStartupPotential(opportunities: OpportunityInput[]): Promise<StartupScoreInput[]>;
  /**
   * Generate venture research report for investment-grade opportunities (Sprint 57).
   * AI returns business data only — no UUIDs, no foreign keys.
   */
  generateVentureReport(opportunities: OpportunityInput[]): Promise<VentureReportInput[]>;
  /**
   * Generate a concise, decision-oriented investment memo (Sprint 58).
   * AI returns business data only — no UUIDs, no foreign keys.
   * Mirrors internal memos used by YC, Sequoia, a16z, Accel.
   */
  generateInvestmentMemo(opportunities: OpportunityInput[]): Promise<InvestmentMemoInput[]>;
  /**
   * Evaluate backtest predictions for opportunities (Sprint 59).
   * AI returns actual_score, accuracy, and notes — no UUIDs, no foreign keys.
   */
  evaluateBacktest(inputs: BacktestInput[]): Promise<BacktestEvaluation[]>;
  /**
   * AI Investment Committee vote (Sprint 61).
   * Returns votes from ALL five agents in a single call — no UUIDs, no FKs.
   * Five independent "VC partners" evaluate the same opportunity.
   */
  generateCommitteeVote(input: CommitteeVoteInput): Promise<CommitteeAgentVote[]>;
  /**
   * Generate complete venture studio blueprint (Sprint 63).
   * AI returns all venture studio content (canvas + GTM + MVP) in a single call.
   * No UUIDs, no foreign keys — pure business content.
   */
  generateVentureProject(opportunities: OpportunityInput[]): Promise<VentureProjectInput[]>;
  generateEmbeddings?(texts: string[]): Promise<number[][]>;
}