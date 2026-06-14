/**
 * Opportunities service - generates business opportunities from pain clusters.
 * Delegates to AIProvider for intelligent opportunity generation.
 */

import type { AIProvider } from "@/types/ai";
import type { PainClusterInput, OpportunityInput } from "@/types/pipeline";

/**
 * Generate business opportunities from pain clusters using AI.
 * 
 * @param clusters - Pain clusters to analyze
 * @param provider - AI provider to use for generation
 * @returns Array of generated opportunities
 */
export async function generateOpportunities(
  clusters: PainClusterInput[],
  provider: AIProvider,
): Promise<OpportunityInput[]> {
  return provider.generateOpportunities(clusters);
}
