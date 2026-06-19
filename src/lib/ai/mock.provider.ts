/**
 * Mock AI Provider - returns fake responses for testing and development
 *
 * NOTE: AI layer returns pure business data only.
 * NO database UUIDs, NO synthetic IDs.
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
  async extractPainPoints(posts: RawPostInput[]): Promise<PainPointInput[]> {
    const painPoints: PainPointInput[] = [];

    for (const post of posts) {
      painPoints.push({
        pain: `Manual process causing errors and inefficiency`,
        category: "Operations",
        severity: 0.8,
        buying_intent: 0.7,
      });

      if (post.score && post.score > 80) {
        painPoints.push({
          pain: `Time-consuming task preventing focus on core business`,
          category: "Productivity",
          severity: 0.9,
          buying_intent: 0.85,
        });
      }
    }

    return painPoints;
  }

  async clusterPainPoints(painPoints: PainPointInput[]): Promise<PainClusterInput[]> {
    const clusterMap = new Map<string, { name: string; description: string; indexes: number[] }>();

    for (let i = 0; i < painPoints.length; i++) {
      const category = painPoints[i].category;
      if (!clusterMap.has(category)) {
        clusterMap.set(category, {
          name: category,
          description: `Pain points related to ${category.toLowerCase()}`,
          indexes: [],
        });
      }
      clusterMap.get(category)!.indexes.push(i);
    }

    return Array.from(clusterMap.values()).map((c) => ({
      cluster_name: c.name,
      description: c.description,
      pain_point_indexes: c.indexes,
    }));
  }

  async generateOpportunities(clusters: PainClusterInput[]): Promise<OpportunityInput[]> {
    return clusters.map((cluster, index) => {
      const frequency = 3 + index;
      const severity = 0.8 + index * 0.05;
      const buyingIntent = 0.7 + index * 0.1;
      const score = Math.round(
        (frequency * 10 + severity * 100 + buyingIntent * 100) / 3,
      );

      return {
        score,
        frequency,
        severity,
        buying_intent: buyingIntent,
        cluster_name: cluster.cluster_name,
        cluster_description: cluster.description,
      };
    });
  }

  async generateStartupIdeas(opportunities: OpportunityInput[]): Promise<StartupIdeaInput[]> {
    return opportunities
      .filter((opp) => opp.score > 70)
      .map((opp, index) => ({
        problem: "Businesses struggle with manual processes and inefficiency in this area",
        solution: `AI-Powered Solution ${index + 1} - Automated platform using machine learning`,
        mvp: "Simple web dashboard with AI assistant",
        pricing: "$99-$499/month SaaS subscription based on usage volume",
        customer: "Small and medium businesses with 10-100 employees",
        distribution: "SEO + Content Marketing + Reddit + Product Hunt",
        competitors: "Existing SaaS tools and manual workflows",
      }));
  }
}