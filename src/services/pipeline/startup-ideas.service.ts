/**
 * Startup ideas service - generates startup ideas from opportunities.
 * Delegates to AIProvider for intelligent idea generation.
 */

import type { AIProvider } from "@/types/ai";
import type { OpportunityInput, StartupIdeaInput } from "@/types/pipeline";

/**
 * Generate startup ideas from opportunities using AI.
 * 
 * @param opportunities - Opportunities to generate ideas for
 * @param provider - AI provider to use for generation
 * @returns Array of generated startup ideas
 */
export async function generateStartupIdeas(
  opportunities: OpportunityInput[],
  provider: AIProvider,
): Promise<StartupIdeaInput[]> {
  return provider.generateStartupIdeas(opportunities);
}
