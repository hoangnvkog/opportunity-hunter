/**
 * Mock AI Provider - returns fake responses for testing and development
 * This provider does not call any external AI service
 */

import type { AIProvider } from "@/types/ai";
import type {
  RawPostInput,
  PainPointInput,
  PainClusterInput,
  OpportunityInput,
  StartupIdeaInput,
} from "@/types/pipeline";

export class MockProvider implements AIProvider {
  /**
   * Extract pain points from raw posts - returns mock data
   */
  async extractPainPoints(posts: RawPostInput[]): Promise<PainPointInput[]> {
    const painPoints: PainPointInput[] = [];

    for (const post of posts) {
      // Generate 1-2 pain points per post based on content
      painPoints.push({
        id: `pain-${post.id}-1`,
        raw_post_id: post.id,
        pain: `Manual process causing errors and inefficiency`,
        category: "Operations",
        severity: 0.8,
        buying_intent: 0.7,
      });

      if (post.score && post.score > 80) {
        painPoints.push({
          id: `pain-${post.id}-2`,
          raw_post_id: post.id,
          pain: `Time-consuming task preventing focus on core business`,
          category: "Productivity",
          severity: 0.9,
          buying_intent: 0.85,
        });
      }
    }

    return painPoints;
  }

  /**
   * Cluster similar pain points - groups by category
   */
  async clusterPainPoints(
    painPoints: PainPointInput[],
  ): Promise<PainClusterInput[]> {
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

  /**
   * Generate opportunities from clusters - calculates scores
   */
  async generateOpportunities(
    clusters: PainClusterInput[],
  ): Promise<OpportunityInput[]> {
    return clusters.map((cluster, index) => {
      const frequency = cluster.pain_point_ids.length;
      const severity = 0.8 + index * 0.05;
      const buyingIntent = 0.7 + index * 0.1;
      const score = Math.round(
        (frequency * 10 + severity * 100 + buyingIntent * 100) / 3,
      );

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

  /**
   * Generate startup ideas from opportunities - template-based
   */
  async generateStartupIdeas(
    opportunities: OpportunityInput[],
  ): Promise<StartupIdeaInput[]> {
    return opportunities
      .filter((opp) => opp.score > 70)
      .map((opportunity, index) => ({
        id: `idea-${opportunity.id}`,
        opportunity_id: opportunity.id,
        problem: `Businesses struggle with manual processes and inefficiency in this area`,
        solution: `AI-Powered Solution ${index + 1} - Automated platform using machine learning`,
        mvp: `Small to medium businesses with 10-100 employees`,
        pricing: `$99-$499/month SaaS subscription based on usage volume`,
      }));
  }
}
