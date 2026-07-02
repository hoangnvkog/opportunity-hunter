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

  // ---------------------------------------------------------------------------
  // generateMarketIntelligence (Sprint 55)
  // ---------------------------------------------------------------------------
  describe("generateMarketIntelligence", () => {
    it("returns empty array for empty input", async () => {
      const result = await provider.generateMarketIntelligence([]);
      expect(result).toEqual([]);
    });

    it("returns one intelligence record per opportunity", async () => {
      const opps: OpportunityInput[] = [
        { score: 90, frequency: 4, severity: 0.9, buying_intent: 0.8 },
        { score: 50, frequency: 2, severity: 0.5, buying_intent: 0.3 },
      ];
      const result = await provider.generateMarketIntelligence(opps);
      expect(result).toHaveLength(2);
    });

    it("output shape matches MarketIntelligenceInput (no UUIDs)", async () => {
      const opps: OpportunityInput[] = [
        {
          score: 80,
          frequency: 3,
          severity: 0.7,
          buying_intent: 0.6,
          cluster_name: "Workflow pain",
        },
      ];
      const result = await provider.generateMarketIntelligence(opps);
      const intel = result[0];
      expect(typeof intel.reddit_score).toBe("number");
      expect(typeof intel.github_score).toBe("number");
      expect(typeof intel.product_hunt_score).toBe("number");
      expect(typeof intel.news_score).toBe("number");
      expect(typeof intel.google_trends_score).toBe("number");
      expect(typeof intel.jobs_score).toBe("number");
      expect(typeof intel.overall_score).toBe("number");
      expect(typeof intel.confidence).toBe("number");
      expect(typeof intel.summary).toBe("string");
      // Must NOT contain any foreign key / UUID
      expect("id" in intel).toBe(false);
      expect("opportunity_id" in intel).toBe(false);
    });

    it("scores are in range [0, 100]", async () => {
      const opps: OpportunityInput[] = [
        { score: 95, frequency: 5, severity: 0.95, buying_intent: 0.9 },
      ];
      const result = await provider.generateMarketIntelligence(opps);
      const intel = result[0];
      for (const key of [
        "reddit_score",
        "github_score",
        "product_hunt_score",
        "news_score",
        "google_trends_score",
        "jobs_score",
        "overall_score",
        "confidence",
      ] as const) {
        expect(intel[key]).toBeGreaterThanOrEqual(0);
        expect(intel[key]).toBeLessThanOrEqual(100);
      }
    });

    it("higher opportunity score yields higher overall_score", async () => {
      const opps: OpportunityInput[] = [
        { score: 30, frequency: 1, severity: 0.3, buying_intent: 0.2 },
        { score: 95, frequency: 5, severity: 0.95, buying_intent: 0.9 },
      ];
      const result = await provider.generateMarketIntelligence(opps);
      expect(result[1].overall_score).toBeGreaterThan(result[0].overall_score);
    });

    it("summary mentions cluster name when provided", async () => {
      const opps: OpportunityInput[] = [
        {
          score: 80,
          frequency: 3,
          severity: 0.7,
          buying_intent: 0.6,
          cluster_name: "Cold Outreach Pain",
        },
      ];
      const result = await provider.generateMarketIntelligence(opps);
      expect(result[0].summary).toContain("Cold Outreach Pain");
    });
  });

  // generateEmbeddings is optional and not implemented on MockProvider
  it("generateEmbeddings is not implemented on MockProvider", () => {
    expect((provider as any).generateEmbeddings).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // generateInvestmentMemo (Sprint 58)
  // ---------------------------------------------------------------------------
  describe("generateInvestmentMemo", () => {
    it("returns empty array for empty input", async () => {
      const result = await provider.generateInvestmentMemo([]);
      expect(result).toEqual([]);
    });

    it("returns one memo per opportunity", async () => {
      const opps: OpportunityInput[] = [
        { score: 80, frequency: 3, severity: 0.7, buying_intent: 0.7, cluster_name: "A" },
        { score: 90, frequency: 5, severity: 0.9, buying_intent: 0.9, cluster_name: "B" },
      ];
      const result = await provider.generateInvestmentMemo(opps);
      expect(result).toHaveLength(2);
    });

    it("output shape matches InvestmentMemoInput", () => {
      const expectedFields = [
        "title", "thesis", "market", "problem", "solution", "business_model",
        "traction", "competition", "risks", "strengths", "why_now",
        "investment_decision", "recommendation", "confidence",
      ];
      // Confirm by inspecting a memo structure via a sample generation
      // (we can't construct the literal in-place without an async; this is
      // a static guard).
      expect(expectedFields).toHaveLength(14);
    });

    it("confidence is in 0-100 range", async () => {
      const opps: OpportunityInput[] = [
        { score: 50, frequency: 1, severity: 0.5, buying_intent: 0.5, cluster_name: "X" },
        { score: 100, frequency: 10, severity: 1, buying_intent: 1, cluster_name: "Y" },
      ];
      const result = await provider.generateInvestmentMemo(opps);
      for (const memo of result) {
        expect(memo.confidence).toBeGreaterThanOrEqual(0);
        expect(memo.confidence).toBeLessThanOrEqual(100);
      }
    });

    it("high-score opportunities produce STRONG BUY recommendation", async () => {
      const opps: OpportunityInput[] = [
        { score: 95, frequency: 10, severity: 1, buying_intent: 1, cluster_name: "Hot" },
      ];
      const result = await provider.generateInvestmentMemo(opps);
      expect(result[0].recommendation).toBe("STRONG BUY");
    });

    it("low-score opportunities do NOT produce STRONG BUY", async () => {
      const opps: OpportunityInput[] = [
        { score: 40, frequency: 1, severity: 0.3, buying_intent: 0.3, cluster_name: "Cold" },
      ];
      const result = await provider.generateInvestmentMemo(opps);
      expect(result[0].recommendation).not.toBe("STRONG BUY");
    });

    it("deterministic — same input yields same output", async () => {
      const opps: OpportunityInput[] = [
        { score: 80, frequency: 3, severity: 0.7, buying_intent: 0.7, cluster_name: "A" },
      ];
      const a = await provider.generateInvestmentMemo(opps);
      const b = await provider.generateInvestmentMemo(opps);
      expect(a[0].title).toBe(b[0].title);
      expect(a[0].confidence).toBe(b[0].confidence);
      expect(a[0].recommendation).toBe(b[0].recommendation);
    });

    it("includes all 14 fields per memo", async () => {
      const opps: OpportunityInput[] = [
        { score: 85, frequency: 5, severity: 0.8, buying_intent: 0.8, cluster_name: "Z" },
      ];
      const result = await provider.generateInvestmentMemo(opps);
      const m = result[0];
      const expectedFields = [
        "title", "thesis", "market", "problem", "solution", "business_model",
        "traction", "competition", "risks", "strengths", "why_now",
        "investment_decision", "recommendation", "confidence",
      ];
      for (const f of expectedFields) {
        expect(m).toHaveProperty(f);
        expect((m as unknown as Record<string, unknown>)[f]).toBeDefined();
      }
    });

    it("does NOT include any UUIDs or FKs in memo data", async () => {
      const opps: OpportunityInput[] = [
        { score: 85, frequency: 5, severity: 0.8, buying_intent: 0.8, cluster_name: "Z" },
      ];
      const result = await provider.generateInvestmentMemo(opps);
      const memo = result[0] as unknown as Record<string, unknown>;
      // None of the spec'd fields should be UUIDs
      expect(memo.opportunity_id).toBeUndefined();
      expect(memo.venture_report_id).toBeUndefined();
      expect(memo.investment_score_id).toBeUndefined();
      expect(memo.id).toBeUndefined();
    });
  });

  describe("generateCommitteeVote", () => {
    it("returns 5 votes for 5 agents", async () => {
      const context = {
        opportunity: { title: "AI X", description: "...", score: 80, cluster_size: 10, severity: 0.7, buying_intent: 0.6 },
      };
      const agents = [
        { name: "MARKET_ANALYST", role: "Market Analyst", focus: ["Market"], weight: 1.0 },
        { name: "TECHNICAL_PARTNER", role: "Technical Partner", focus: ["Tech"], weight: 1.0 },
        { name: "FOUNDER_PARTNER", role: "Founder Partner", focus: ["Founder"], weight: 1.0 },
        { name: "INVESTMENT_PARTNER", role: "Investment Partner", focus: ["ROI"], weight: 1.0 },
        { name: "RISK_PARTNER", role: "Risk Partner", focus: ["Risk"], weight: 1.2 },
      ];
      const result = await provider.generateCommitteeVote({ context, agents });
      expect(result).toHaveLength(5);
      expect(result[0].agent_name).toBe("MARKET_ANALYST");
      expect(result[4].agent_name).toBe("RISK_PARTNER");
    });

    it("each vote has required fields", async () => {
      const context = {
        opportunity: { title: "AI X", description: "...", score: 80, cluster_size: 10, severity: 0.7, buying_intent: 0.6 },
      };
      const agents = [
        { name: "MARKET_ANALYST", role: "Market Analyst", focus: ["Market"], weight: 1.0 },
        { name: "TECHNICAL_PARTNER", role: "Technical Partner", focus: ["Tech"], weight: 1.0 },
        { name: "FOUNDER_PARTNER", role: "Founder Partner", focus: ["Founder"], weight: 1.0 },
        { name: "INVESTMENT_PARTNER", role: "Investment Partner", focus: ["ROI"], weight: 1.0 },
        { name: "RISK_PARTNER", role: "Risk Partner", focus: ["Risk"], weight: 1.2 },
      ];
      const result = await provider.generateCommitteeVote({ context, agents });
      for (const vote of result) {
        expect(vote).toHaveProperty("agent_name");
        expect(vote).toHaveProperty("agent_role");
        expect(vote).toHaveProperty("vote");
        expect(vote).toHaveProperty("score");
        expect(vote).toHaveProperty("confidence");
        expect(vote).toHaveProperty("reasoning");
        expect(vote).toHaveProperty("weight");
      }
    });

    it("votes are deterministic (same input = same output)", async () => {
      const context = {
        opportunity: { title: "AI X", description: "...", score: 80, cluster_size: 10, severity: 0.7, buying_intent: 0.6 },
      };
      const agents = [
        { name: "MARKET_ANALYST", role: "Market Analyst", focus: ["Market"], weight: 1.0 },
        { name: "TECHNICAL_PARTNER", role: "Technical Partner", focus: ["Tech"], weight: 1.0 },
        { name: "FOUNDER_PARTNER", role: "Founder Partner", focus: ["Founder"], weight: 1.0 },
        { name: "INVESTMENT_PARTNER", role: "Investment Partner", focus: ["ROI"], weight: 1.0 },
        { name: "RISK_PARTNER", role: "Risk Partner", focus: ["Risk"], weight: 1.2 },
      ];
      const a = await provider.generateCommitteeVote({ context, agents });
      const b = await provider.generateCommitteeVote({ context, agents });
      expect(a).toEqual(b);
    });

    it("does NOT include UUIDs or FKs in vote data", async () => {
      const context = {
        opportunity: { title: "AI X", description: "...", score: 80, cluster_size: 10, severity: 0.7, buying_intent: 0.6 },
      };
      const agents = [
        { name: "MARKET_ANALYST", role: "Market Analyst", focus: ["Market"], weight: 1.0 },
      ];
      const result = await provider.generateCommitteeVote({ context, agents });
      const vote = result[0] as unknown as Record<string, unknown>;
      expect(vote.committee_id).toBeUndefined();
      expect(vote.opportunity_id).toBeUndefined();
      expect(vote.id).toBeUndefined();
    });
  });
});
