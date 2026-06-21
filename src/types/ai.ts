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

/**
 * AI Provider interface - defines contract for all AI/LLM providers
 * Implementations: MockProvider, OpenAIProvider, GeminiProvider
 */
export interface AIProvider {
  /**
   * Extract pain points from raw posts using AI/NLP
   */
  extractPainPoints(posts: RawPostInput[]): Promise<PainPointInput[]>;

  /**
   * Cluster similar pain points using AI/similarity algorithms
   */
  clusterPainPoints(painPoints: PainPointInput[]): Promise<PainClusterInput[]>;

  /**
   * Generate business opportunities from pain clusters using AI
   */
  generateOpportunities(
    clusters: PainClusterInput[],
  ): Promise<OpportunityInput[]>;

  /**
   * Generate startup ideas from opportunities using AI
   */
  generateStartupIdeas(
    opportunities: OpportunityInput[],
  ): Promise<StartupIdeaInput[]>;

  /**
   * Generate embeddings for text using OpenAI embedding model
   */
  generateEmbeddings?(texts: string[]): Promise<number[][]>;
}
