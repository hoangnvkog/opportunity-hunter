import { describe, it, expect, beforeEach, vi } from "vitest";
import { MarketIntelligenceRepository } from "../market-intelligence.repository";
import type {
  MarketIntelligenceRow,
} from "@/types/market-intelligence";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<MarketIntelligenceRow> = {},
): MarketIntelligenceRow =>
  ({
    id,
    opportunity_id: `opp-${id}`,
    reddit_score: 70,
    github_score: 65,
    product_hunt_score: 60,
    news_score: 55,
    google_trends_score: 75,
    jobs_score: 50,
    overall_score: 62,
    confidence: 80,
    summary: `Intelligence summary ${id}`,
    created_at: new Date().toISOString(),
    ...overrides,
  } as MarketIntelligenceRow);

describe("MarketIntelligenceRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- create ----
  it("create(): inserts an intelligence record", async () => {
    const mockRow = makeRow("m-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.create({
      opportunity_id: "opp-m-1",
      reddit_score: 70,
      github_score: 65,
      product_hunt_score: 60,
      news_score: 55,
      google_trends_score: 75,
      jobs_score: 50,
      overall_score: 62,
      confidence: 80,
      summary: "Strong signals",
    });

    expect(result).toEqual(mockRow);
    expect(mockFrom).toHaveBeenCalledWith("market_intelligence");
  });

  // ---- createMany ----
  it("createMany(): returns empty array for empty input", async () => {
    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.createMany([]);
    expect(result).toEqual([]);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("createMany(): inserts multiple records", async () => {
    const rows = [makeRow("m-1"), makeRow("m-2")];
    mockClient.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    }) as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.createMany([
      {
        opportunity_id: "opp-1",
        reddit_score: 70,
        github_score: 65,
        product_hunt_score: 60,
        news_score: 55,
        google_trends_score: 75,
        jobs_score: 50,
        overall_score: 62,
        confidence: 80,
      },
      {
        opportunity_id: "opp-2",
        reddit_score: 80,
        github_score: 75,
        product_hunt_score: 70,
        news_score: 65,
        google_trends_score: 85,
        jobs_score: 60,
        overall_score: 72,
        confidence: 85,
      },
    ]);
    expect(result).toEqual(rows);
  });

  // ---- findByOpportunity ----
  it("findByOpportunity(): returns a row", async () => {
    const row = makeRow("m-1", { opportunity_id: "opp-1" });
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.findByOpportunity("opp-x");
    expect(result).toBeNull();
  });

  // ---- deleteByOpportunity ----
  it("deleteByOpportunity(): removes records for an opportunity", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          // count() for head:true
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }) as never;

    // First chain is count (head:true), second is delete
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const deleted = await repo.deleteByOpportunity("opp-1");
    expect(deleted).toBe(2);
  });

  // ---- list ----
  it("list(): returns paginated rows sorted by overall_score desc by default", async () => {
    const rows = [makeRow("m-1"), makeRow("m-2")];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    }) as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.list({ limit: 10 });
    expect(result).toEqual(rows);
  });

  it("list(): filters by minScore", async () => {
    const rows = [makeRow("m-1")];
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
    await repo.list({ minScore: 60 });
    expect(gteMock).toHaveBeenCalledWith("overall_score", 60);
  });

  // ---- listTop ----
  it("listTop(): returns top by overall_score", async () => {
    const rows = [makeRow("m-1")];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    }) as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.averageScore();
    expect(result).toBe(70);
  });

  it("averageScore(): returns 0 when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.topScore();
    expect(result).toBe(0);
  });

  // ---- mostDiscussedOpportunityId ----
  it("mostDiscussedOpportunityId(): returns opportunity_id with highest overall_score", async () => {
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.mostDiscussedOpportunityId();
    expect(result).toBe("opp-best");
  });

  it("mostDiscussedOpportunityId(): returns null when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }) as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.mostDiscussedOpportunityId();
    expect(result).toBeNull();
  });

  // ---- getStats ----
  it("getStats(): returns aggregate stats", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          makeRow("m-1", {
            reddit_score: 80,
            github_score: 70,
            product_hunt_score: 60,
            news_score: 50,
            google_trends_score: 90,
            jobs_score: 40,
            overall_score: 70,
            confidence: 80,
          }),
          makeRow("m-2", {
            reddit_score: 60,
            github_score: 50,
            product_hunt_score: 40,
            news_score: 30,
            google_trends_score: 70,
            jobs_score: 20,
            overall_score: 50,
            confidence: 70,
          }),
        ],
        error: null,
      }),
    }) as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.getStats();

    expect(result.total).toBe(2);
    expect(result.highestOverallScore).toBe(70);
    expect(result.averageOverallScore).toBe(60);
    expect(result.averageConfidence).toBe(75);
    expect(result.averageRedditScore).toBe(70);
    expect(result.averageJobsScore).toBe(30);
  });

  it("getStats(): returns zeros when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.getStats();
    expect(result.total).toBe(0);
    expect(result.highestOverallScore).toBe(0);
    expect(result.averageOverallScore).toBe(0);
  });

  // ---- getSignalDistribution ----
  it("getSignalDistribution(): returns 5 buckets by overall_score range", async () => {
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

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.getSignalDistribution();

    expect(result).toHaveLength(5);
    expect(result.find((b) => b.bucket === "0-20")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "21-40")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "41-60")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "61-80")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "81-100")?.count).toBe(1);
  });

  // ---- getHistory ----
  it("getHistory(): groups records by date and computes avgScore", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { created_at: "2026-06-20T10:00:00Z", overall_score: 70 },
            { created_at: "2026-06-20T15:00:00Z", overall_score: 80 },
            { created_at: "2026-06-21T10:00:00Z", overall_score: 90 },
          ],
          error: null,
        }),
      }),
    }) as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.getHistory(30);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-06-20");
    expect(result[0].count).toBe(2);
    expect(result[0].avgScore).toBe(75);
    expect(result[1].date).toBe("2026-06-21");
    expect(result[1].count).toBe(1);
    expect(result[1].avgScore).toBe(90);
  });

  // ---- getConfidenceHistory ----
  it("getConfidenceHistory(): groups by date and computes avgConfidence", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { created_at: "2026-06-20T10:00:00Z", confidence: 70 },
            { created_at: "2026-06-20T15:00:00Z", confidence: 90 },
            { created_at: "2026-06-21T10:00:00Z", confidence: 80 },
          ],
          error: null,
        }),
      }),
    }) as never;

    const repo = new MarketIntelligenceRepository(mockClient as never);
    const result = await repo.getConfidenceHistory(30);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-06-20");
    expect(result[0].avgConfidence).toBe(80);
    expect(result[1].date).toBe("2026-06-21");
    expect(result[1].avgConfidence).toBe(80);
  });
});