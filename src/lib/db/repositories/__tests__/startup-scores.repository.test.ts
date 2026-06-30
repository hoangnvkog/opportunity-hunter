import { describe, it, expect, beforeEach, vi } from "vitest";
import { StartupScoresRepository } from "../startup-scores.repository";
import type { StartupScoreRow } from "@/types/startup-score";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<StartupScoreRow> = {},
): StartupScoreRow =>
  ({
    id,
    opportunity_id: `opp-${id}`,
    tam_score: 80,
    market_timing_score: 75,
    competition_score: 70,
    moat_score: 65,
    distribution_score: 60,
    execution_score: 55,
    capital_efficiency_score: 50,
    overall_score: 65,
    confidence: 80,
    recommendation: "Watch",
    summary: `Score summary ${id}`,
    created_at: new Date().toISOString(),
    ...overrides,
  } as StartupScoreRow);

describe("StartupScoresRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- create ----
  it("create(): inserts a startup score record", async () => {
    const mockRow = makeRow("s-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.create({
      opportunity_id: "opp-s-1",
      tam_score: 80,
      market_timing_score: 75,
      competition_score: 70,
      moat_score: 65,
      distribution_score: 60,
      execution_score: 55,
      capital_efficiency_score: 50,
      overall_score: 65,
      confidence: 80,
      recommendation: "Watch",
      summary: "Strong potential",
    });

    expect(result).toEqual(mockRow);
    expect(mockFrom).toHaveBeenCalledWith("startup_scores");
  });

  // ---- createMany ----
  it("createMany(): returns empty array for empty input", async () => {
    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.createMany([]);
    expect(result).toEqual([]);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("createMany(): inserts multiple records", async () => {
    const rows = [makeRow("s-1"), makeRow("s-2")];
    mockClient.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.createMany([
      {
        opportunity_id: "opp-1",
        tam_score: 80,
        market_timing_score: 75,
        competition_score: 70,
        moat_score: 65,
        distribution_score: 60,
        execution_score: 55,
        capital_efficiency_score: 50,
        overall_score: 65,
        confidence: 80,
      },
      {
        opportunity_id: "opp-2",
        tam_score: 90,
        market_timing_score: 85,
        competition_score: 80,
        moat_score: 75,
        distribution_score: 70,
        execution_score: 65,
        capital_efficiency_score: 60,
        overall_score: 75,
        confidence: 85,
      },
    ]);
    expect(result).toEqual(rows);
  });

  // ---- findByOpportunity ----
  it("findByOpportunity(): returns a row", async () => {
    const row = makeRow("s-1", { opportunity_id: "opp-1" });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
            }),
          }),
        }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.findByOpportunity("opp-1");
    expect(result).toEqual(row);
  });

  it("findByOpportunity(): returns null when no row", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.findByOpportunity("opp-x");
    expect(result).toBeNull();
  });

  // ---- deleteByOpportunity ----
  it("deleteByOpportunity(): removes records for an opportunity", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 2 }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }) as never;

    let callIdx = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      if (callIdx++ === 0) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 2 }),
          }),
        };
      }
      return {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const deleted = await repo.deleteByOpportunity("opp-1");
    expect(deleted).toBe(2);
  });

  // ---- list ----
  it("list(): returns paginated rows sorted by overall_score desc by default", async () => {
    const rows = [makeRow("s-1"), makeRow("s-2")];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.list({ limit: 10 });
    expect(result).toEqual(rows);
  });

  it("list(): filters by minScore", async () => {
    const rows = [makeRow("s-1")];
    const gteMock = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: gteMock,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    await repo.list({ minScore: 60 });
    expect(gteMock).toHaveBeenCalledWith("overall_score", 60);
  });

  // ---- listTop ----
  it("listTop(): returns top by overall_score", async () => {
    const rows = [makeRow("s-1")];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.listTop(5);
    expect(result).toEqual(rows);
  });

  // ---- count ----
  it("count(): returns total record count", async () => {
    const chainable: Record<string, unknown> = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "then") {
            return (cb: (v: { count: number; data: null; error: null }) => void) =>
              Promise.resolve({ data: null, count: 42, error: null }).then(cb);
          }
          if (typeof prop === "string") {
            return () => chainable;
          }
          return undefined;
        },
      },
    );
    mockClient.from = vi.fn().mockReturnValue({ select: () => chainable }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.count();
    expect(result).toBe(42);
  });

  // ---- averageScore ----
  it("averageScore(): returns average overall_score", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { overall_score: 70 },
          { overall_score: 80 },
          { overall_score: 60 },
        ],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.averageScore();
    expect(result).toBe(70);
  });

  it("averageScore(): returns 0 when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.averageScore();
    expect(result).toBe(0);
  });

  // ---- topScore ----
  it("topScore(): returns highest overall_score", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [{ overall_score: 95 }],
            error: null,
          }),
        }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.topScore();
    expect(result).toBe(95);
  });

  it("topScore(): returns 0 when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.topScore();
    expect(result).toBe(0);
  });

  // ---- averageConfidence ----
  it("averageConfidence(): returns average confidence", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ confidence: 70 }, { confidence: 90 }],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.averageConfidence();
    expect(result).toBe(80);
  });

  it("averageConfidence(): returns 0 when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.averageConfidence();
    expect(result).toBe(0);
  });

  // ---- investmentGradeCount ----
  it("investmentGradeCount(): returns count with threshold", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.investmentGradeCount(90);
    expect(result).toBe(5);
  });

  it("investmentGradeCount(): uses default threshold 90", async () => {
    const gteMock = vi.fn().mockResolvedValue({ count: 3, error: null });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: gteMock,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    await repo.investmentGradeCount();
    expect(gteMock).toHaveBeenCalledWith("overall_score", 90);
  });

  // ---- topOpportunityId ----
  it("topOpportunityId(): returns opportunity_id with highest overall_score", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [{ opportunity_id: "opp-best", overall_score: 95 }],
            error: null,
          }),
        }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.topOpportunityId();
    expect(result).toBe("opp-best");
  });

  it("topOpportunityId(): returns null when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.topOpportunityId();
    expect(result).toBeNull();
  });

  // ---- listCards ----
  it("listCards(): returns joined data with opportunity and cluster", async () => {
    const mockRows = [
      {
        id: "s-1",
        opportunity_id: "opp-1",
        tam_score: 80,
        market_timing_score: 75,
        competition_score: 70,
        moat_score: 65,
        distribution_score: 60,
        execution_score: 55,
        capital_efficiency_score: 50,
        overall_score: 65,
        confidence: 80,
        recommendation: "Watch",
        summary: "Summary 1",
        created_at: "2026-06-20T10:00:00Z",
        opportunity: { id: "opp-1", title: "Opportunity 1", pain_cluster: { name: "Cluster A" } },
      },
      {
        id: "s-2",
        opportunity_id: "opp-2",
        tam_score: 90,
        market_timing_score: 85,
        competition_score: 80,
        moat_score: 75,
        distribution_score: 70,
        execution_score: 65,
        capital_efficiency_score: 60,
        overall_score: 75,
        confidence: 85,
        recommendation: "Strong Invest",
        summary: "Summary 2",
        created_at: "2026-06-21T10:00:00Z",
        opportunity: { id: "opp-2", title: "Opportunity 2", pain_cluster: null },
      },
    ];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
        }),
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.listCards({ limit: 2 });

    expect(result).toHaveLength(2);
    expect(result[0].opportunity_title).toBe("Opportunity 1");
    expect(result[0].cluster_name).toBe("Cluster A");
    expect(result[1].cluster_name).toBeNull();
  });

  // ---- getStats ----
  it("getStats(): returns aggregate stats", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          makeRow("s-1", {
            tam_score: 80,
            market_timing_score: 75,
            competition_score: 70,
            moat_score: 65,
            distribution_score: 60,
            execution_score: 55,
            capital_efficiency_score: 50,
            overall_score: 70,
            confidence: 80,
          }),
          makeRow("s-2", {
            tam_score: 60,
            market_timing_score: 55,
            competition_score: 50,
            moat_score: 45,
            distribution_score: 40,
            execution_score: 35,
            capital_efficiency_score: 30,
            overall_score: 50,
            confidence: 70,
          }),
        ],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getStats();

    expect(result.total).toBe(2);
    expect(result.highestOverallScore).toBe(70);
    expect(result.averageOverallScore).toBe(60);
    expect(result.investmentGradeCount).toBe(0);
    expect(result.averageConfidence).toBe(75);
    expect(result.averageTamScore).toBe(70);
    expect(result.averageMarketTimingScore).toBe(65);
    expect(result.averageCompetitionScore).toBe(60);
    expect(result.averageMoatScore).toBe(55);
    expect(result.averageDistributionScore).toBe(50);
    expect(result.averageExecutionScore).toBe(45);
    expect(result.averageCapitalEfficiencyScore).toBe(40);
  });

  it("getStats(): returns zeros when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getStats();
    expect(result.total).toBe(0);
    expect(result.highestOverallScore).toBe(0);
    expect(result.averageOverallScore).toBe(0);
    expect(result.investmentGradeCount).toBe(0);
    expect(result.averageConfidence).toBe(0);
  });

  // ---- getDimensionAverages ----
  it("getDimensionAverages(): returns average per dimension", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          makeRow("s-1", { tam_score: 80, market_timing_score: 70, competition_score: 60, moat_score: 50, distribution_score: 40, execution_score: 30, capital_efficiency_score: 20 }),
          makeRow("s-2", { tam_score: 60, market_timing_score: 50, competition_score: 40, moat_score: 30, distribution_score: 20, execution_score: 10, capital_efficiency_score: 10 }),
        ],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getDimensionAverages();

    expect(result).toHaveLength(7);
    expect(result.find((d) => d.dimension === "tam_score")?.average).toBe(70);
    expect(result.find((d) => d.dimension === "market_timing_score")?.average).toBe(60);
  });

  it("getDimensionAverages(): returns empty array when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getDimensionAverages();
    expect(result).toEqual([]);
  });

  // ---- getRecommendationBreakdown ----
  it("getRecommendationBreakdown(): returns counts by recommendation", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { recommendation: "Strong Invest" },
          { recommendation: "Watch" },
          { recommendation: "Watch" },
          { recommendation: "Pass" },
          { recommendation: null },
        ],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getRecommendationBreakdown();

    expect(result).toEqual([
      { recommendation: "Watch", count: 2 },
      { recommendation: "Strong Invest", count: 1 },
      { recommendation: "Pass", count: 1 },
      { recommendation: "Unknown", count: 1 },
    ]);
  });

  // ---- getScoreDistribution ----
  it("getScoreDistribution(): returns 5 buckets by overall_score range", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { overall_score: 10 },
          { overall_score: 30 },
          { overall_score: 50 },
          { overall_score: 70 },
          { overall_score: 95 },
        ],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getScoreDistribution();

    expect(result).toHaveLength(5);
    expect(result.find((b) => b.bucket === "0-20")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "21-40")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "41-60")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "61-80")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "81-100")?.count).toBe(1);
  });
});