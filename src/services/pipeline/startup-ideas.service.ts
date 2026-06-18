/**
 * Startup ideas service - generates startup ideas from opportunities.
 * Delegates to AIProvider for intelligent idea generation.
 */

import type { AIProvider } from "@/types/ai";
import type { OpportunityInput, StartupIdeaInput } from "@/types/pipeline";
import type { OpportunityRow, StartupIdeaInsert } from "@/types";
import { OpportunitiesRepository, StartupIdeasRepository } from "@/lib/db/repositories";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";

/**
 * Convert OpportunityRow to OpportunityInput for AI provider
 */
function toOpportunityInput(row: OpportunityRow): OpportunityInput {
  return {
    id: row.id,
    cluster_id: row.cluster_id,
    title: row.title,
    description: row.description,
    score: parseFloat(row.score),
    frequency: row.frequency,
    severity: parseFloat(row.severity),
    buying_intent: parseFloat(row.buying_intent),
  };
}

/**
 * Convert StartupIdeaInput to StartupIdeaInsert for database
 */
function toStartupIdeaInsert(input: StartupIdeaInput): StartupIdeaInsert {
  return {
    opportunity_id: input.opportunity_id,
    problem: input.problem,
    solution: input.solution,
    mvp: input.mvp,
    pricing: input.pricing,
  };
}

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

/**
 * Generate startup ideas from opportunities in database and insert into startup_ideas.
 * Uses AI provider from environment (default: MockProvider).
 * Skips duplicate ideas by opportunity_id.
 * 
 * @param limit - Maximum number of opportunities to process (default: 50)
 * @returns Object with counts: processed, generated, skipped, inserted
 */
export async function generateStartupIdeasFromDatabase(
  limit: number = 50,
): Promise<{
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}> {
  // Get repositories
  const opportunitiesRepo = await OpportunitiesRepository.create();
  const ideasRepo = await StartupIdeasRepository.create();
  
  // Load opportunities from database
  const opportunities = await opportunitiesRepo.list({ limit });
  
  if (opportunities.length === 0) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }
  
  // Convert to OpportunityInput for AI provider
  const opportunitiesInput = opportunities.map(toOpportunityInput);
  
  // Get AI provider from environment (default: MockProvider)
  const provider = getAIProviderFromEnv();
  
  // Generate startup ideas using AI
  const ideas = await provider.generateStartupIdeas(opportunitiesInput);
  
  if (ideas.length === 0) {
    return { processed: opportunities.length, generated: 0, skipped: 0, inserted: 0 };
  }
  
  // Load existing startup ideas to detect duplicates by opportunity_id
  const existingIdeas = await ideasRepo.list({ limit: 1000 });
  const existingOpportunityIds = new Set(
    existingIdeas.map(idea => idea.opportunity_id)
  );
  
  // Filter out duplicates and convert to insert format
  const newIdeas = ideas
    .filter(idea => !existingOpportunityIds.has(idea.opportunity_id))
    .map(toStartupIdeaInsert);
  
  const skipped = ideas.length - newIdeas.length;
  
  // Insert new startup ideas one by one
  let inserted = 0;
  for (const idea of newIdeas) {
    try {
      await ideasRepo.create(idea);
      inserted++;
    } catch (error) {
      // Skip duplicates that were inserted between check and insert
      console.error(`Failed to insert idea for opportunity ${idea.opportunity_id}:`, error);
    }
  }
  
  return {
    processed: opportunities.length,
    generated: ideas.length,
    skipped,
    inserted,
  };
}
