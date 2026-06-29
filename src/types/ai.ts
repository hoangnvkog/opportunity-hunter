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
  generateEmbeddings?(texts: string[]): Promise<number[][]>;
}