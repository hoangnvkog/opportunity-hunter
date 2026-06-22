/**
 * Gemini Provider - stub implementation
 * TODO: Implement with Google AI SDK (@google/generative-ai) when ready
 *
 * This provider will use Google's Gemini models for:
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
import type { OpportunityInsightInput } from "@/types/opportunity-insight";

export class GeminiProvider implements AIProvider {
  constructor(
    private readonly apiKey?: string,
    private readonly model: string = "gemini-1.5-flash",
  ) {
    // TODO: Initialize Gemini client when SDK is installed
    // this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Extract pain points using Gemini
   */
  async extractPainPoints(_posts: RawPostInput[]): Promise<PainPointInput[]> {
    throw new Error(
      "GeminiProvider.extractPainPoints() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  /**
   * Cluster pain points using Gemini embeddings or generative model
   */
  async clusterPainPoints(
    _painPoints: PainPointInput[],
  ): Promise<PainClusterInput[]> {
    throw new Error(
      "GeminiProvider.clusterPainPoints() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  /**
   * Generate opportunities using Gemini
   */
  async generateOpportunities(
    _clusters: PainClusterInput[],
  ): Promise<OpportunityInput[]> {
    throw new Error(
      "GeminiProvider.generateOpportunities() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  /**
   * Generate business insights using Gemini (Sprint 46 — stub).
   */
  async generateInsights(
    _opportunities: OpportunityInput[],
  ): Promise<OpportunityInsightInput[]> {
    throw new Error(
      "GeminiProvider.generateInsights() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }

  /**
   * Generate startup ideas using Gemini
   */
  async generateStartupIdeas(
    _opportunities: OpportunityInput[],
  ): Promise<StartupIdeaInput[]> {
    throw new Error(
      "GeminiProvider.generateStartupIdeas() not implemented yet. Install @google/generative-ai SDK and implement.",
    );
  }
}
