import { PainClustersRepository } from "@/lib/db/repositories/pain-clusters.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";
import type { PainClusterInput, OpportunityInput } from "@/types/pipeline";

/**
 * Generate opportunities from clusters that don't have opportunities yet
 * Uses incremental processing: only processes clusters where opportunity_generated = false
 */
export async function generateOpportunitiesFromDatabase(limit = 50): Promise<{
  processed: number;
  generated: number;
  inserted: number;
}> {
  const clustersRepo = await PainClustersRepository.create();
  const opportunitiesRepo = await OpportunitiesRepository.create();

  // Fetch only clusters that haven't generated opportunities
  const unprocessedClusters = await clustersRepo.listUnprocessedForOpportunities(limit);

  if (unprocessedClusters.length === 0) {
    return { processed: 0, generated: 0, inserted: 0 };
  }

  const provider = getAIProviderFromEnv();

  // Convert to pipeline input
  const inputs: PainClusterInput[] = unprocessedClusters.map((c) => ({
    cluster_name: c.name,
    description: c.description,
    pain_point_indexes: [],
  }));

  // Generate opportunities using AI
  const opportunities: OpportunityInput[] = await provider.generateOpportunities(inputs);

  if (opportunities.length === 0) {
    return { processed: 0, generated: 0, inserted: 0 };
  }

  let inserted = 0;
  const processedClusterIds: string[] = [];

  // Insert opportunities and mark clusters as processed
  for (let i = 0; i < opportunities.length; i++) {
    const cluster = unprocessedClusters[i];
    const opportunity = opportunities[i];

    if (!cluster || !opportunity) continue;

    try {
      await opportunitiesRepo.create({
        cluster_id: cluster.id,
        title: opportunity.cluster_name || cluster.name,
        description: opportunity.cluster_description || cluster.description,
        score: opportunity.score.toFixed(3),
        frequency: opportunity.frequency,
        severity: opportunity.severity.toFixed(3),
        buying_intent: opportunity.buying_intent.toFixed(3),
      });
      inserted++;

      // Mark cluster as processed
      await clustersRepo.markOpportunityGenerated(cluster.id);
      processedClusterIds.push(cluster.id);
    } catch (error) {
      console.error(`Failed to insert opportunity for cluster ${cluster.id}:`, error);
    }
  }

  return {
    processed: processedClusterIds.length,
    generated: opportunities.length,
    inserted,
  };
}
