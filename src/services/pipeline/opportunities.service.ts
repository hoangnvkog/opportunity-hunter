/**
 * Opportunities service - generates business opportunities from pain clusters.
 * Delegates to AIProvider for intelligent opportunity generation.
 */

import type { AIProvider } from "@/types/ai";
import type { PainClusterInput, OpportunityInput } from "@/types/pipeline";
import type { PainClusterRow, OpportunityInsert } from "@/types";
import { PainClustersRepository, OpportunitiesRepository } from "@/lib/db/repositories";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";

/**
 * Convert PainClusterRow to PainClusterInput for AI provider
 */
function toPainClusterInput(row: PainClusterRow): PainClusterInput {
  return {
    id: row.id,
    cluster_name: row.name,
    description: row.description,
    pain_point_ids: [], // Not stored in DB, AI provider will handle
  };
}

/**
 * Convert OpportunityInput to OpportunityInsert for database
 */
function toOpportunityInsert(input: OpportunityInput): OpportunityInsert {
  return {
    cluster_id: input.cluster_id,
    score: input.score.toString(),
    frequency: input.frequency,
    severity: input.severity.toString(),
    buying_intent: input.buying_intent.toString(),
  };
}

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

/**
 * Generate opportunities from pain_clusters in database and insert into opportunities.
 * Uses AI provider from environment (default: MockProvider).
 * Skips duplicate opportunities by cluster_id.
 * 
 * @param limit - Maximum number of clusters to process (default: 50)
 * @returns Object with counts: processed, generated, skipped, inserted
 */
export async function generateOpportunitiesFromDatabase(
  limit: number = 50,
): Promise<{
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}> {
  // Get repositories
  const clustersRepo = await PainClustersRepository.create();
  const opportunitiesRepo = await OpportunitiesRepository.create();
  
  // Load pain clusters from database
  const clusters = await clustersRepo.listAll();
  
  // Limit clusters to process
  const clustersToProcess = clusters.slice(0, limit);
  
  if (clustersToProcess.length === 0) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }
  
  // Convert to PainClusterInput for AI provider
  const clustersInput = clustersToProcess.map(toPainClusterInput);
  
  // Get AI provider from environment (default: MockProvider)
  const provider = getAIProviderFromEnv();
  
  // Generate opportunities using AI
  const opportunities = await provider.generateOpportunities(clustersInput);
  
  if (opportunities.length === 0) {
    return { processed: clustersToProcess.length, generated: 0, skipped: 0, inserted: 0 };
  }
  
  // Load existing opportunities to detect duplicates by cluster_id
  const existingOpportunities = await opportunitiesRepo.list({ limit: 1000 });
  const existingClusterIds = new Set(
    existingOpportunities.map(opp => opp.cluster_id)
  );
  
  // Filter out duplicates and convert to insert format
  const newOpportunities = opportunities
    .filter(opp => !existingClusterIds.has(opp.cluster_id))
    .map(toOpportunityInsert);
  
  const skipped = opportunities.length - newOpportunities.length;
  
  // Insert new opportunities one by one
  let inserted = 0;
  for (const opportunity of newOpportunities) {
    try {
      await opportunitiesRepo.create(opportunity);
      inserted++;
    } catch (error) {
      // Skip duplicates that were inserted between check and insert
      console.error(`Failed to insert opportunity for cluster ${opportunity.cluster_id}:`, error);
    }
  }
  
  return {
    processed: clustersToProcess.length,
    generated: opportunities.length,
    skipped,
    inserted,
  };
}
