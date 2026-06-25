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
import type { OpportunityInsightInput } from "@/types/opportunity-insight";
import type { OpportunityValidationInput } from "@/types/validation";
import type { EvidenceInput } from "@/types/evidence";

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

  async generateInsights(
    opportunities: OpportunityInput[],
  ): Promise<OpportunityInsightInput[]> {
    // Synthetic insights that scale with the opportunity's score so tests
    // can observe the signal deterministically without burning API quota.
    return opportunities.map((opp) => {
      const intensity = opp.score / 100;
      const competition =
        intensity > 0.75 ? "High" : intensity > 0.4 ? "Medium" : "Low";
      const urgency =
        opp.buying_intent > 0.7 ? "High" : opp.buying_intent > 0.4 ? "Medium" : "Low";
      const market =
        intensity > 0.7 ? "$1.2B TAM (US)" : intensity > 0.4 ? "$300M TAM" : "Niche (~5k buyers)";
      return {
        summary: `Pain around ${opp.cluster_name ?? "this cluster"} suggests a SaaS opportunity to streamline manual workflows.`,
        market_size: market,
        competition_level: competition as OpportunityInsightInput["competition_level"],
        urgency: urgency as OpportunityInsightInput["urgency"],
        recommended_mvp: "Web dashboard with templated workflows and one-click integrations.",
        recommended_channels: "Reddit, Product Hunt, SEO",
        confidence_score: Math.round(Math.min(0.95, 0.5 + intensity / 2) * 100) / 100,
      };
    });
  }

  async validateOpportunities(
    opportunities: OpportunityInput[],
  ): Promise<OpportunityValidationInput[]> {
    // Returns deterministic mock validation data for testing.
    // Uses opportunity score as a signal so tests can verify ordering.
    return opportunities.map((opp) => {
      const score = opp.score / 100;
      const marketDemand = Math.round(60 + score * 30);
      const competition = Math.round(40 + (1 - score) * 40);
      const monetization = Math.round(65 + score * 25);
      const buildDifficulty = Math.round(50 - score * 30);
      const validationScore = Math.round(
        marketDemand * 0.30 +
        monetization * 0.35 +
        (100 - competition) * 0.25 +
        (100 - buildDifficulty) * 0.10,
      );
      return {
        market_demand: marketDemand,
        competition,
        monetization,
        build_difficulty: buildDifficulty,
        validation_score: validationScore,
        reasoning: `Mock validation for ${opp.cluster_name ?? "opportunity"}: ` +
          `Market=${marketDemand}, Competition=${competition}, ` +
          `Monetization=${monetization}, Difficulty=${buildDifficulty}`,
      };
    });
  }

  async findMarketEvidence(
    opportunities: OpportunityInput[],
  ): Promise<EvidenceInput[][]> {
    // Deterministic mock evidence for testing
    // Returns 3-5 evidence items per opportunity
    return opportunities.map((opp, idx) => {
      const baseScore = (opp.score ?? 50) / 100;
      const evidence: EvidenceInput[] = [
        {
          evidence_type: "competitor",
          source: "Market Analysis",
          title: `Competitor ${idx + 1}`,
          summary: `Established player ${idx + 1} serving the ${opp.cluster_name ?? "market"} space`,
          confidence: Math.round((0.7 + baseScore * 0.2) * 100) / 100 * 100,
        },
        {
          evidence_type: "pricing",
          source: "Pricing Data",
          title: "Market pricing signal",
          summary: "Pricing ranges from $29-$199/month in this segment",
          confidence: 85,
        },
        {
          evidence_type: "customer_quote",
          source: "Customer Feedback",
          title: "Customer pain point",
          summary: "Users seeking better solutions for this problem",
          confidence: Math.round((0.6 + baseScore * 0.3) * 100) / 100 * 100,
        },
      ];
      // Add more evidence for higher-scored opportunities
      if (opp.score >= 80) {
        evidence.push({
          evidence_type: "market_report",
          source: "Industry Report",
          title: "Market growth report",
          summary: "Market showing strong growth trajectory",
          confidence: 90,
        });
      }
      if (opp.score >= 90) {
        evidence.push({
          evidence_type: "google_trend",
          source: "Google Trends",
          title: "Search trend spike",
          summary: "Search interest up 40% YoY",
          confidence: 88,
        });
      }
      return evidence;
    });
  }
}