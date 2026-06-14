/**
 * Opportunities service - generates business opportunities from pain clusters.
 * Currently returns mock data. Ready for LLM integration.
 */

import type { PainClusterInput, OpportunityInput } from "@/types/pipeline";

/**
 * Generate business opportunities from pain clusters using AI.
 * TODO: Integrate with LLM to analyze clusters and generate opportunity scores
 */
export async function generateOpportunities(
  clusters: PainClusterInput[],
): Promise<OpportunityInput[]> {
  // Mock implementation - generates opportunities with calculated scores
  // In production, this would use LLM to analyze market potential
  return clusters.map((cluster, index) => {
    const frequency = cluster.pain_point_ids.length;
    const severity = 0.8 + index * 0.05; // Mock severity scaling
    const buyingIntent = 0.7 + index * 0.1; // Mock buying intent scaling
    const score = Math.round((frequency * 10 + severity * 100 + buyingIntent * 100) / 3);

    return {
      id: `opp-${cluster.id}`,
      cluster_id: cluster.id,
      score,
      frequency,
      severity,
      buying_intent: buyingIntent,
    };
  });
}
