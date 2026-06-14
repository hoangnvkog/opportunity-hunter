/**
 * OpenAI Provider - stub implementation
 * TODO: Implement with OpenAI SDK (openai) when ready
 *
 * This provider will use OpenAI's GPT models for:
 * - Pain point extraction from raw posts
 * - Semantic clustering of pain points
 * - Opportunity scoring and generation
 * - Startup idea generation
 */

import type { AIProvider } from "@/types/ai";
import type {
  RawPostInput,
  PainPointInput,
  PainClusterInput,
  OpportunityInput,
  StartupIdeaInput,
} from "@/types/pipeline";

export class OpenAIProvider implements AIProvider {
  constructor(
    private readonly apiKey?: string,
    private readonly model: string = "gpt-4o-mini",
  ) {
    // TODO: Initialize OpenAI client when SDK is installed
    // this.client = new OpenAI({ apiKey });
  }

  /**
   * Extract pain points using OpenAI GPT
   */
  async extractPainPoints(_posts: RawPostInput[]): Promise<PainPointInput[]> {
    throw new Error(
      "OpenAIProvider.extractPainPoints() not implemented yet. Install openai SDK and implement.",
    );
  }

  /**
   * Cluster pain points using OpenAI embeddings or GPT
   */
  async clusterPainPoints(
    _painPoints: PainPointInput[],
  ): Promise<PainClusterInput[]> {
    throw new Error(
      "OpenAIProvider.clusterPainPoints() not implemented yet. Install openai SDK and implement.",
    );
  }

  /**
   * Generate opportunities using OpenAI GPT
   */
  async generateOpportunities(
    _clusters: PainClusterInput[],
  ): Promise<OpportunityInput[]> {
    throw new Error(
      "OpenAIProvider.generateOpportunities() not implemented yet. Install openai SDK and implement.",
    );
  }

  /**
   * Generate startup ideas using OpenAI GPT
   */
  async generateStartupIdeas(
    _opportunities: OpportunityInput[],
  ): Promise<StartupIdeaInput[]> {
    throw new Error(
      "OpenAIProvider.generateStartupIdeas() not implemented yet. Install openai SDK and implement.",
    );
  }
}
