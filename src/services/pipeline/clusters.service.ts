import { PainPointsRepository } from "@/lib/db/repositories/pain-points.repository";
import { PainClustersRepository } from "@/lib/db/repositories/pain-clusters.repository";
import { EmbeddingsRepository } from "@/lib/db/repositories/embeddings.repository";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";
import { clusterPainPointsBySimilarity } from "@/lib/clustering/semantic-cluster";
import type { PainPointEmbedding } from "@/types/clustering";
import type { PainClusterInput } from "@/types/pipeline";

/**
 * Cluster unclustered pain points using semantic similarity
 * Uses incremental processing: only processes pain points where clustered = false
 */
export async function clusterPainPointsFromDatabase(limit = 100): Promise<{
  processed: number;
  clustered: number;
  inserted: number;
  averageClusterSize: number;
  largestClusterSize: number;
}> {
  const painPointsRepo = await PainPointsRepository.create();
  const clustersRepo = await PainClustersRepository.create();
  const embeddingsRepo = await EmbeddingsRepository.create();

  // Fetch only unclustered pain points
  const unclusteredPoints = await painPointsRepo.listUnclustered(limit);

  if (unclusteredPoints.length === 0) {
    return { processed: 0, clustered: 0, inserted: 0, averageClusterSize: 0, largestClusterSize: 0 };
  }

  console.log(`Loaded ${unclusteredPoints.length} unclustered pain points`);

  // Fetch embeddings for unclustered pain points
  const embeddings: PainPointEmbedding[] = [];
  for (const point of unclusteredPoints) {
    const embeddingRow = await embeddingsRepo.findByPainPointId(point.id);
    if (embeddingRow) {
      embeddings.push({
        painPointId: point.id,
        description: point.description,
        embedding: embeddingRow.embedding,
      });
    }
  }

  console.log(`Loaded ${embeddings.length} embeddings`);

  if (embeddings.length === 0) {
    console.warn("No embeddings found for unclustered pain points");
    return { processed: 0, clustered: 0, inserted: 0, averageClusterSize: 0, largestClusterSize: 0 };
  }

  // Cluster using semantic similarity.
  //
  // Threshold calibration note (Sprint 68):
  // - NVIDIA `nv-embedqa-e5-v5` (1024d) produces cosine similarities in
  //   the 0.45-0.85 range for *related* content and 0.15-0.45 for
  //   *unrelated* content. The historical 0.85 default created a
  //   similarity graph with zero edges in practice → every pain point
  //   became its own cluster of size 1.
  // - 0.7 is the empirically working default for this embedding model.
  //   Operators can override per-deploy via `SIMILARITY_THRESHOLD`.
  const similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || "0.7");
  const semanticClusters = clusterPainPointsBySimilarity(embeddings, {
    similarityThreshold,
    minClusterSize: 1,
  });

  console.log(`[Clusters] Similarity threshold: ${similarityThreshold}`);
  console.log(
    `[Clusters] Built semantic clusters: ${semanticClusters.length} (avg size ${
      semanticClusters.length > 0
        ? (semanticClusters.reduce((s, c) => s + c.members.length, 0) / semanticClusters.length).toFixed(2)
        : 0
    }, largest ${semanticClusters.length > 0 ? Math.max(...semanticClusters.map((c) => c.members.length)) : 0})`
  );

  if (semanticClusters.length === 0) {
    return { processed: 0, clustered: 0, inserted: 0, averageClusterSize: 0, largestClusterSize: 0 };
  }

  const provider = getAIProviderFromEnv();

  // Generate cluster names and descriptions using GPT (one request per cluster)
  const clusterInputs: PainClusterInput[] = [];
  for (const cluster of semanticClusters) {
    const descriptions = cluster.members.map(m => m.description).join("\n");
    
    try {
      // Generate name and description for this cluster
      const clusterData = await provider.clusterPainPoints([
        {
          pain: descriptions,
          category: "auto",
          severity: 0.5,
          buying_intent: 0.5,
        },
      ]);

      if (clusterData.length > 0) {
        cluster.name = clusterData[0].cluster_name;
        cluster.description = clusterData[0].description;
      } else {
        cluster.name = "General";
        cluster.description = "Miscellaneous pain points";
      }
    } catch (error) {
      console.error(`Failed to generate cluster name:`, error);
      cluster.name = "General";
      cluster.description = "Miscellaneous pain points";
    }

    clusterInputs.push({
      cluster_name: cluster.name,
      description: cluster.description,
      pain_point_indexes: cluster.members.map((m, idx) => idx),
    });
  }

  let inserted = 0;
  const processedPointIds: string[] = [];

  // Insert clusters and mark pain points as clustered
  for (let i = 0; i < semanticClusters.length; i++) {
    const cluster = semanticClusters[i];
    const clusterInput = clusterInputs[i];

    try {
      // Check if cluster already exists
      const existing = await clustersRepo.findByName(clusterInput.cluster_name);
      
      if (!existing) {
        // Create new cluster with cluster_size
        await clustersRepo.create({
          name: clusterInput.cluster_name,
          description: clusterInput.description,
          cluster_size: cluster.members.length,
        });
        inserted++;
      }

      // Mark all pain points in this cluster as clustered
      for (const member of cluster.members) {
        await painPointsRepo.markClustered(member.painPointId);
        processedPointIds.push(member.painPointId);
      }
    } catch (error) {
      console.error(`Failed to insert cluster ${clusterInput.cluster_name}:`, error);
    }
  }

  const totalMembers = semanticClusters.reduce((sum, c) => sum + c.members.length, 0);
  const averageClusterSize = semanticClusters.length > 0 ? totalMembers / semanticClusters.length : 0;
  const largestClusterSize = semanticClusters.length > 0 
    ? Math.max(...semanticClusters.map(c => c.members.length))
    : 0;

  console.log(`Average cluster size: ${averageClusterSize.toFixed(1)}`);
  console.log(`Largest cluster: ${largestClusterSize} pain points`);

  return {
    processed: processedPointIds.length,
    clustered: semanticClusters.length,
    inserted,
    averageClusterSize,
    largestClusterSize,
  };
}
