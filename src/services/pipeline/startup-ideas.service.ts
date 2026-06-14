/**
 * Startup ideas service - generates startup ideas from opportunities.
 * Currently returns mock data. Ready for LLM integration.
 */

import type { OpportunityInput, StartupIdeaInput } from "@/types/pipeline";

/**
 * Generate startup ideas from opportunities using AI.
 * TODO: Integrate with LLM to generate creative, viable startup concepts
 */
export async function generateStartupIdeas(
  opportunities: OpportunityInput[],
): Promise<StartupIdeaInput[]> {
  // Mock implementation - generates template startup ideas
  // In production, this would use LLM to generate creative, market-aware ideas
  return opportunities
    .filter((opp) => opp.score > 70) // Only high-score opportunities
    .map((opportunity, index) => ({
      id: `idea-${opportunity.id}`,
      opportunity_id: opportunity.id,
      name: `AI-Powered Solution ${index + 1}`,
      description: `Automated platform that solves the pain points identified in this opportunity cluster using machine learning and intelligent workflows.`,
      target_market: `Small to medium businesses struggling with manual processes and inefficiency`,
      monetization: `SaaS subscription model with tiered pricing based on usage volume`,
    }));
}
