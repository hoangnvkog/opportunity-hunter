import { describe, it, expect } from "vitest";
import { MockProvider } from "@/lib/ai/mock.provider";
import type {
  RawPostInput,
  PainPointInput,
  PainClusterInput,
  OpportunityInput,
} from "@/types/pipeline";

function makePost(overrides: Partial<RawPostInput> = {}): RawPostInput {
  return {
    source: "reddit",
    title: "Test post",
    content: "Some content here",
    url: "https://reddit.com/r/test/1",
    score: 50,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("MockProvider", () => {
  const provider = new MockProvider();

  // ---------------------------------------------------------------------------
  // extractPainPoints
  // ---------------------------------------------------------------------------
  describe("extractPainPoints", () => {
    it("returns empty array for empty input", async () => {
      const result = await provider.extractPainPoints([]);
      expect(result).toEqual([]);
    });

    it("returns one pain point per post (score ≤ 80)", async () => {
      const posts = [makePost(), makePost({ score: 30 })];
      const result = await provider.extractPainPoints(posts);
      expect(result).toHaveLength(2);
      for (const pp of result) {
        expect(pp).toHaveProperty("pain");
        expect(pp).toHaveProperty("category");
        expect(pp).toHaveProperty("severity");
        expect(pp).toHaveProperty("buying_intent");
        expect(typeof pp.pain).toBe("string");
        expect(typeof pp.category).toBe("string");
        expect(typeof pp.severity).toBe("number");
        expect(typeof pp.buying_intent).toBe("number");
      }
    });

    it("returns two pain points for high-score posts (>80)", async () => {
      const posts = [makePost({ score: 90 })];
      const result = await provider.extractPainPoints(posts);
      expect(result).toHaveLength(2);
    });

    it("handles mix of high and low score posts", async () => {
      const posts = [
        makePost({ score: 100 }),
        makePost({ score: 50 }),
        makePost({ score: 81 }),
      ];
      const result = await provider.extractPainPoints(posts);
      // post 1 (>80): 2 points, post 2 (50): 1 point, post 3 (81): 2 points = 5
      expect(result).toHaveLength(5);
    });

    it("severity and buying_intent are between 0 and 1", async () => {
      const posts = [makePost({ score: 95 })];
      const result = await provider.extractPainPoints(posts);
      for (const pp of result) {
        expect(pp.severity).toBeGreaterThanOrEqual(0);
        expect(pp.severity).toBeLessThanOrEqual(1);
        expect(pp.buying_intent).toBeGreaterThanOrEqual(0);
        expect(pp.buying_intent).toBeLessThanOrEqual(1);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // clusterPainPoints
  // ---------------------------------------------------------------------------
  describe("clusterPainPoints", () => {
    it("returns empty array for empty input", async () => {
      const result = await provider.clusterPainPoints([]);
      expect(result).toEqual([]);
    });

    it("clusters by category", async () => {
      const points: PainPointInput[] = [
        { pain: "A", category: "Operations", severity: 0.8, buying_intent: 0.7 },
        { pain: "B", category: "Operations", severity: 0.7, buying_intent: 0.6 },
        { pain: "C", category: "Productivity", severity: 0.9, buying_intent: 0.8 },
      ];
      const result = await provider.clusterPainPoints(points);
      expect(result).toHaveLength(2);

      const opsCluster = result.find((c) => c.cluster_name === "Operations");
      expect(opsCluster).toBeDefined();
      expect(opsCluster!.pain_point_indexes).toEqual([0, 1]);

      const prodCluster = result.find((c) => c.cluster_name === "Productivity");
      expect(prodCluster).toBeDefined();
      expect(prodCluster!.pain_point_indexes).toEqual([2]);
    });

    it("output shape has cluster_name, description, pain_point_indexes", async () => {
      const points: PainPointInput[] = [
        { pain: "X", category: "Cat", severity: 0.5, buying_intent: 0.5 },
      ];
      const result = await provider.clusterPainPoints(points);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("cluster_name");
      expect(result[0]).toHaveProperty("description");
      expect(result[0]).toHaveProperty("pain_point_indexes");
      expect(Array.isArray(result[0].pain_point_indexes)).toBe(true);
    });

    it("handles single pain point", async () => {
      const points: PainPointInput[] = [
        { pain: "Solo", category: "Solo", severity: 0.5, buying_intent: 0.5 },
      ];
      const result = await provider.clusterPainPoints(points);
      expect(result).toHaveLength(1);
      expect(result[0].pain_point_indexes).toEqual([0]);
    });
  });

  // ---------------------------------------------------------------------------
  // generateOpportunities
  // ---------------------------------------------------------------------------
  describe("generateOpportunities", () => {
    it("returns empty array for empty input", async () => {
      const result = await provider.generateOpportunities([]);
      expect(result).toEqual([]);
    });

    it("returns one opportunity per cluster", async () => {
      const clusters: PainClusterInput[] = [
        { cluster_name: "A", description: "desc A", pain_point_indexes: [0, 1] },
        { cluster_name: "B", description: "desc B", pain_point_indexes: [2] },
      ];
      const result = await provider.generateOpportunities(clusters);
      expect(result).toHaveLength(2);
    });

    it("output shape matches OpportunityInput", async () => {
      const clusters: PainClusterInput[] = [
        { cluster_name: "C", description: "desc C", pain_point_indexes: [0] },
      ];
      const result = await provider.generateOpportunities(clusters);
      expect(result).toHaveLength(1);
      const opp = result[0];
      expect(typeof opp.score).toBe("number");
      expect(typeof opp.frequency).toBe("number");
      expect(typeof opp.severity).toBe("number");
      expect(typeof opp.buying_intent).toBe("number");
      expect(opp.cluster_name).toBe("C");
      expect(opp.cluster_description).toBe("desc C");
    });

    it("score increases with cluster index", async () => {
      const clusters: PainClusterInput[] = [
        { cluster_name: "X", description: "d", pain_point_indexes: [0] },
        { cluster_name: "Y", description: "d", pain_point_indexes: [1] },
        { cluster_name: "Z", description: "d", pain_point_indexes: [2] },
      ];
      const result = await provider.generateOpportunities(clusters);
      expect(result[0].score).toBeLessThan(result[1].score);
      expect(result[1].score).toBeLessThan(result[2].score);
    });
  });

  // ---------------------------------------------------------------------------
  // generateStartupIdeas
  // ---------------------------------------------------------------------------
  describe("generateStartupIdeas", () => {
    it("returns empty array for empty input", async () => {
      const result = await provider.generateStartupIdeas([]);
      expect(result).toEqual([]);
    });

    it("filters out opportunities with score ≤ 70", async () => {
      const opps: OpportunityInput[] = [
        { score: 50, frequency: 3, severity: 0.8, buying_intent: 0.7 },
        { score: 80, frequency: 5, severity: 0.9, buying_intent: 0.8 },
      ];
      const result = await provider.generateStartupIdeas(opps);
      expect(result).toHaveLength(1);
    });

    it("output shape matches StartupIdeaInput", async () => {
      const opps: OpportunityInput[] = [
        { score: 90, frequency: 4, severity: 0.85, buying_intent: 0.75 },
      ];
      const result = await provider.generateStartupIdeas(opps);
      expect(result).toHaveLength(1);
      const idea = result[0];
      expect(typeof idea.problem).toBe("string");
      expect(typeof idea.solution).toBe("string");
      expect(typeof idea.mvp).toBe("string");
      expect(typeof idea.pricing).toBe("string");
      expect(typeof idea.customer).toBe("string");
      expect(typeof idea.distribution).toBe("string");
      expect(typeof idea.competitors).toBe("string");
    });

    it("generates one idea per qualifying opportunity", async () => {
      const opps: OpportunityInput[] = [
        { score: 75, frequency: 3, severity: 0.8, buying_intent: 0.7 },
        { score: 85, frequency: 4, severity: 0.9, buying_intent: 0.8 },
        { score: 60, frequency: 2, severity: 0.6, buying_intent: 0.5 },
      ];
      const result = await provider.generateStartupIdeas(opps);
      expect(result).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // generateInsights
  // ---------------------------------------------------------------------------
  describe("generateInsights", () => {
    it("returns empty array for empty input", async () => {
      const result = await provider.generateInsights([]);
      expect(result).toEqual([]);
    });

    it("returns one insight per opportunity", async () => {
      const opps: OpportunityInput[] = [
        { score: 80, frequency: 3, severity: 0.8, buying_intent: 0.7 },
        { score: 50, frequency: 2, severity: 0.5, buying_intent: 0.3 },
      ];
      const result = await provider.generateInsights(opps);
      expect(result).toHaveLength(2);
    });

    it("output shape matches OpportunityInsightInput", async () => {
      const opps: OpportunityInput[] = [
        { score: 90, frequency: 4, severity: 0.9, buying_intent: 0.8, cluster_name: "TestCluster" },
      ];
      const result = await provider.generateInsights(opps);
      expect(result).toHaveLength(1);
      const insight = result[0];
      expect(typeof insight.summary).toBe("string");
      expect(typeof insight.market_size).toBe("string");
      expect(["Low", "Medium", "High"]).toContain(insight.competition_level);
      expect(["Low", "Medium", "High"]).toContain(insight.urgency);
      expect(typeof insight.recommended_mvp).toBe("string");
      expect(typeof insight.recommended_channels).toBe("string");
      expect(typeof insight.confidence_score).toBe("number");
      expect(insight.confidence_score).toBeGreaterThanOrEqual(0);
      expect(insight.confidence_score).toBeLessThanOrEqual(1);
    });

    it("high score opportunities get High competition", async () => {
      const opps: OpportunityInput[] = [
        { score: 90, frequency: 4, severity: 0.9, buying_intent: 0.8 },
      ];
      const result = await provider.generateInsights(opps);
      expect(result[0].competition_level).toBe("High");
    });

    it("low score opportunities get Low competition", async () => {
      const opps: OpportunityInput[] = [
        { score: 20, frequency: 1, severity: 0.2, buying_intent: 0.1 },
      ];
      const result = await provider.generateInsights(opps);
      expect(result[0].competition_level).toBe("Low");
    });
  });

  // generateEmbeddings is optional and not implemented on MockProvider
  it("generateEmbeddings is not implemented on MockProvider", () => {
    expect((provider as any).generateEmbeddings).toBeUndefined();
  });
});
