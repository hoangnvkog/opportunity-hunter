/**
 * Startup ideas service - generates startup ideas from opportunities.
 * Delegates to AIProvider for intelligent idea generation.
 */

import type { AIProvider } from "@/types/ai";
import type { OpportunityInput, StartupIdeaInput } from "@/types/pipeline";
import type { OpportunityRow, StartupIdeaInsert } from "@/types";
import {
  OpportunitiesRepository,
  StartupIdeasRepository,
} from "@/lib/db/repositories";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";

/**
 * Convert OpportunityRow to OpportunityInput for AI provider
 */
function toOpportunityInput(row: OpportunityRow): OpportunityInput {
  return {
    score: parseFloat(row.score),
    frequency: row.frequency,
    severity: parseFloat(row.severity),
    buying_intent: parseFloat(row.buying_intent),
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
 * Database is single source of truth for all UUIDs.
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

  // Filter to only validated opportunities with score >= 70 (Sprint 51)
  const {
    OpportunityValidationsRepository,
  } = await import(
    "@/lib/db/repositories/opportunity-validations.repository"
  );
  const valRepo = await OpportunityValidationsRepository.create();
  const validated = await valRepo.list({ limit: 500, minScore: 70 });
  const validatedOppIds = new Set(validated.map((v) => v.opportunity_id));

  const validOpportunities = opportunities.filter((o) =>
    validatedOppIds.has(o.id),
  );

  if (validOpportunities.length === 0) {
    console.log(
      "No validated opportunities with score >= 70 found. " +
      "Run the validation stage first.",
    );
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  // Convert to OpportunityInput for AI provider
  const opportunitiesInput = validOpportunities.map(toOpportunityInput);

  // Get AI provider from environment (default: MockProvider)
  const provider = getAIProviderFromEnv();

  // Generate startup ideas using AI
  const ideas = await provider.generateStartupIdeas(opportunitiesInput);

  if (ideas.length === 0) {
    return {
      processed: validOpportunities.length,
      generated: 0,
      skipped: 0,
      inserted: 0,
    };
  }

  // Load existing startup ideas to detect duplicates by opportunity_id
  const existingIdeas = await ideasRepo.list({ limit: 1000 });
  const existingOpportunityIds = new Set(
    existingIdeas.map((idea) => idea.opportunity_id),
  );

  // Map AI output index to real opportunity UUID and filter duplicates
  const ideasToInsert: StartupIdeaInsert[] = [];
  for (let i = 0; i < ideas.length; i++) {
    const idea = ideas[i];
    const opportunity = validOpportunities[i];
    if (!opportunity) continue;

    const insert: StartupIdeaInsert = {
      opportunity_id: opportunity.id,
      problem: idea.problem,
      solution: idea.solution,
      mvp: idea.mvp,
      pricing: idea.pricing,
    };

    // Skip if already exists
    if (existingOpportunityIds.has(opportunity.id)) continue;

    ideasToInsert.push(insert);
  }

  const skipped = ideas.length - ideasToInsert.length;

  // Insert new startup ideas one by one
  let inserted = 0;
  for (const idea of ideasToInsert) {
    try {
      await ideasRepo.create(idea);
      inserted++;
    } catch (error) {
      console.error(
        `Failed to insert idea for opportunity ${idea.opportunity_id}:`,
        error,
      );
    }
  }

  return {
    processed: validOpportunities.length,
    generated: ideas.length,
    skipped,
    inserted,
  };
}