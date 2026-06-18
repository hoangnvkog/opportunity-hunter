/**
 * Clusters service - groups similar pain points into clusters.
 * Delegates to AIProvider for intelligent clustering.
 */

import type { AIProvider } from "@/types/ai";
import type { PainPointInput, PainClusterInput } from "@/types/pipeline";
import type { PainPointRow, PainClusterInsert } from "@/types";
import { PainPointsRepository, PainClustersRepository } from "@/lib/db/repositories";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";

/**
 * Convert PainPointRow to PainPointInput for AI provider
 */
function toPainPointInput(row: PainPointRow): PainPointInput {
  return {
    id: row.id,
    raw_post_id: row.id, // Use pain point id as placeholder
    pain: row.description,
    category: 'uncategorized', // Default category
    severity: parseFloat(row.severity),
    buying_intent: parseFloat(row.buying_intent),
  };
}

/**
 * Convert PainClusterInput to PainClusterInsert for database
 */
function toPainClusterInsert(input: PainClusterInput): PainClusterInsert {
  return {
    name: input.cluster_name,
    description: input.description,
  };
}

/**
 * Cluster similar pain points using AI/NLP.
 * 
 * @param painPoints - Pain points to cluster
 * @param provider - AI provider to use for clustering
 * @returns Array of pain point clusters
 */
export async function clusterPainPoints(
  painPoints: PainPointInput[],
  provider: AIProvider,
): Promise<PainClusterInput[]> {
  return provider.clusterPainPoints(painPoints);
}

/**
 * Cluster pain points from database and insert into pain_clusters.
 * Uses AI provider from environment (default: MockProvider).
 * Skips duplicate clusters by name.
 * 
 * @param limit - Maximum number of pain points to process (default: 100)
 * @returns Object with counts: processed, clustered, skipped, inserted
 */
export async function clusterPainPointsFromDatabase(
  limit: number = 100,
): Promise<{
  processed: number;
  clustered: number;
  skipped: number;
  inserted: number;
}> {
  // Get repositories
  const painPointsRepo = await PainPointsRepository.create();
  const clustersRepo = await PainClustersRepository.create();
  
  // Load pain points from database
  const painPoints = await painPointsRepo.list({ limit });
  
  if (painPoints.length === 0) {
    return { processed: 0, clustered: 0, skipped: 0, inserted: 0 };
  }
  
  // Convert to PainPointInput for AI provider
  const pointsInput = painPoints.map(toPainPointInput);
  
  // Get AI provider from environment (default: MockProvider)
  const provider = getAIProviderFromEnv();
  
  // Cluster pain points using AI
  const clusters = await provider.clusterPainPoints(pointsInput);
  
  if (clusters.length === 0) {
    return { processed: painPoints.length, clustered: 0, skipped: 0, inserted: 0 };
  }
  
  // Load existing clusters to detect duplicates
  const existingClusters = await clustersRepo.listAll();
  const existingNames = new Set(
    existingClusters.map(c => c.name.toLowerCase())
  );
  
  // Filter out duplicates and convert to insert format
  const newClusters = clusters
    .filter(cluster => !existingNames.has(cluster.cluster_name.toLowerCase()))
    .map(toPainClusterInsert);
  
  const skipped = clusters.length - newClusters.length;
  
  // Insert new clusters one by one (no createMany method available)
  let inserted = 0;
  for (const cluster of newClusters) {
    try {
      await clustersRepo.create(cluster);
      inserted++;
    } catch (error) {
      // Skip duplicates that were inserted between check and insert
      console.error(`Failed to insert cluster ${cluster.name}:`, error);
    }
  }
  
  return {
    processed: painPoints.length,
    clustered: clusters.length,
    skipped,
    inserted,
  };
}
