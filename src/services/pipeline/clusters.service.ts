/**
 * Clusters service - groups similar pain points into clusters.
 * Delegates to AIProvider for intelligent clustering.
 */

import type { AIProvider } from "@/types/ai";
import type { PainPointInput, PainClusterInput } from "@/types/pipeline";

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
