/**
 * Clusters service - groups similar pain points into clusters.
 * Currently returns mock data. Ready for LLM integration.
 */

import type { PainPointInput, PainClusterInput } from "@/types/pipeline";

/**
 * Cluster similar pain points using AI/NLP.
 * TODO: Integrate with LLM or clustering algorithms (K-means, DBSCAN, etc.)
 */
export async function clusterPainPoints(
  painPoints: PainPointInput[],
): Promise<PainClusterInput[]> {
  // Mock implementation - groups by category
  // In production, this would use semantic similarity or clustering algorithms
  const clusters = new Map<string, PainClusterInput>();

  for (const painPoint of painPoints) {
    const clusterName = painPoint.category;
    const existing = clusters.get(clusterName);

    if (existing) {
      existing.pain_point_ids.push(painPoint.id);
    } else {
      clusters.set(clusterName, {
        id: `cluster-${clusterName.toLowerCase().replace(/\s+/g, "-")}`,
        cluster_name: clusterName,
        description: `Pain points related to ${clusterName.toLowerCase()}`,
        pain_point_ids: [painPoint.id],
      });
    }
  }

  return Array.from(clusters.values());
}
