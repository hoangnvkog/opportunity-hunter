/**
 * Sprint 56: Startup Scores Repository Tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { StartupScoresRepository, INVESTMENT_GRADE_THRESHOLD } from "../startup-scores.repository";
import type { StartupScoreRow } from "@/types/startup-score";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<StartupScoreRow> = {},
): StartupScoreRow =>
  ({
    id,
    opportunity_id: `opp-${id}`,
    tam_score: 75,
    market_timing_score: 70,
    competition_score: 65,
    moat_score: 60,
    distribution_score: 72,
    execution_score: 68,
    capital_efficiency_score: 78,
    overall_score: 70,
    confidence: 80,
    recommendation: "Watch",
    summary: "Solid opportunity",
    created_at: new Date().toISOString(),
    ...overrides,
  }) as StartupScoreRow;

describe("StartupScoresRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      tam_score: 75,
      market_timing_score: 70,
      competition_score: 65,
      moat_score: 60,
      distribution_score: 72,
      execution_score: 68,
      capital_efficiency_score: 78,
      overall_score: 70,
      confidence: 80,
    });

    expect(result).toEqual(mockRow);
    expect(mockFrom).toHaveBeenCalledWith("startup_scores");
  });

  it("createMany(): returns empty array for empty input", async () => {
    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.createMany([]);
    expect(result).toEqual([]);
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
      { opportunity_id: "opp-1", tam_score: 70, market_timing_score: 70, competition_score: 70, moat_score: 70, distribution_score: 70, execution_score: 70, capital_efficiency_score: 70, overall_score: 70, confidence: 80 },
      { opportunity_id: "opp-2", tam_score: 80, market_timing_score: 80, competition_score: 80, moat_score: 80, distribution_score: 80, execution_score: 80, capital_efficiency_score: 80, overall_score: 80, confidence: 85 },
    ]);
    expect(result).toEqual(rows);
  });

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

  it("deleteByOpportunity(): removes records and returns count", async () => {
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
    const gteMock = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
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

  it("averageScore(): returns average overall_score", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ overall_score: 70 }, { overall_score: 80 }, { overall_score: 60 }],
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

  it("topOpportunityId(): returns opportunity_id with highest score", async () => {
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

  it("averageConfidence(): returns average confidence", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ confidence: 80 }, { confidence: 60 }],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.averageConfidence();
    expect(result).toBe(70);
  });

  it("getStats(): returns aggregate stats", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          makeRow("s-1", { overall_score: 95, confidence: 80, tam_score: 85, market_timing_score: 75, competition_score: 70, moat_score: 65, distribution_score: 80, execution_score: 70, capital_efficiency_score: 78 }),
          makeRow("s-2", { overall_score: 80, confidence: 70, tam_score: 60, market_timing_score: 65, competition_score: 55, moat_score: 50, distribution_score: 60, execution_score: 58, capital_efficiency_score: 68 }),
        ],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getStats();

    expect(result.total).toBe(2);
    expect(result.highestOverallScore).toBe(95);
    expect(result.averageOverallScore).toBe(87.5);
    expect(result.averageConfidence).toBe(75);
    expect(result.averageTamScore).toBe(72.5);
    expect(result.investmentGradeCount).toBe(1);
  });

  it("getStats(): returns zeros when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getStats();
    expect(result.total).toBe(0);
    expect(result.averageOverallScore).toBe(0);
    expect(result.investmentGradeCount).toBe(0);
  });

  it("getDimensionAverages(): returns average per dimension", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { tam_score: 70, market_timing_score: 70, competition_score: 70, moat_score: 70, distribution_score: 70, execution_score: 70, capital_efficiency_score: 70 },
          { tam_score: 80, market_timing_score: 80, competition_score: 80, moat_score: 80, distribution_score: 80, execution_score: 80, capital_efficiency_score: 80 },
        ],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getDimensionAverages();
    const tam = result.find((d) => d.dimension === "tam_score");
    expect(tam?.average).toBe(75);
  });

  it("getDimensionAverages(): returns empty array when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getDimensionAverages();
    expect(result).toEqual([]);
  });

  it("getRecommendationBreakdown(): returns recommendation counts", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { recommendation: "Strong Invest" },
          { recommendation: "Strong Invest" },
          { recommendation: "Watch" },
        ],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getRecommendationBreakdown();
    expect(result.find((r) => r.recommendation === "Strong Invest")?.count).toBe(2);
    expect(result.find((r) => r.recommendation === "Watch")?.count).toBe(1);
  });

  it("getScoreDistribution(): returns 5 buckets", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { overall_score: 10 },
          { overall_score: 30 },
          { overall_score: 50 },
          { overall_score: 95 },
        ],
        error: null,
      }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getScoreDistribution();

    expect(result).toHaveLength(5);
    expect(result.find((b) => b.bucket === "0-20")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "81-100")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "41-60")?.count).toBe(1);
  });

  it("getScoreDistribution(): all zeros when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new StartupScoresRepository(mockClient as never);
    const result = await repo.getScoreDistribution();
    expect(result.every((b) => b.count === 0)).toBe(true);
  });

  it("investmentGradeCount(): uses default threshold of 90", () => {
    expect(INVESTMENT_GRADE_THRESHOLD).toBe(90);
  });
});
