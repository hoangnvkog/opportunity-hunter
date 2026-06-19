import { PainPointsRepository } from "@/lib/db/repositories/pain-points.repository";
import { PainClustersRepository } from "@/lib/db/repositories/pain-clusters.repository";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";
import type { PainPointInput, PainClusterInput } from "@/types/pipeline";

/**
 * Cluster unclustered pain points
 * Uses incremental processing: only processes pain points where clustered = false
 */
export async function clusterPainPointsFromDatabase(limit = 100): Promise<{
  processed: number;
  clustered: number;
  inserted: number;
}> {
  const painPointsRepo = await PainPointsRepository.create();
  const clustersRepo = await PainClustersRepository.create();

  // Fetch only unclustered pain points
  const unclusteredPoints = await painPointsRepo.listUnclustered(limit);

  if (unclusteredPoints.length === 0) {
    return { processed: 0, clustered: 0, inserted: 0 };
  }

  const provider = getAIProviderFromEnv();
  
  // Convert to pipeline input
  const inputs: PainPointInput[] = unclusteredPoints.map((p) => ({
    pain: p.description,
    category: p.category,
    severity: parseFloat(p.severity),
    buying_intent: parseFloat(p.buying_intent),
  }));

  // Cluster using AI
  const clusters: PainClusterInput[] = await provider.clusterPainPoints(inputs);

  if (clusters.length === 0) {
    return { processed: 0, clustered: 0, inserted: 0 };
  }

  let inserted = 0;
  const processedPointIds: string[] = [];

  // Insert clusters and mark pain points as clustered
  for (const cluster of clusters) {
    try {
      // Check if cluster already exists
      const existing = await clustersRepo.findByName(cluster.cluster_name);
      
      if (!existing) {
        // Create new cluster
        await clustersRepo.create({
          name: cluster.cluster_name,
          description: cluster.description,
        });
        inserted++;
      }

      // Mark all pain points in this cluster as clustered
      if (cluster.pain_point_indexes && cluster.pain_point_indexes.length > 0) {
        for (const index of cluster.pain_point_indexes) {
          if (index < unclusteredPoints.length) {
            const point = unclusteredPoints[index];
            await painPointsRepo.markClustered(point.id);
            processedPointIds.push(point.id);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to insert cluster ${cluster.cluster_name}:`, error);
    }
  }

  return {
    processed: processedPointIds.length,
    clustered: clusters.length,
    inserted,
  };
}
