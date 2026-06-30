import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  InvestmentMemosRepository,
  INVESTMENT_MEMO_SCORE_THRESHOLD,
} from "../investment-memos.repository";
import type { InvestmentMemoRow } from "@/types/investment-memo";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<InvestmentMemoRow> = {},
): InvestmentMemoRow =>
  ({
    id,
    opportunity_id: `opp-${id}`,
    venture_report_id: `vr-${id}`,
    investment_score_id: `sc-${id}`,
    title: `Investment Memo ${id}`,
    thesis: `Thesis for ${id}`,
    market: `Market for ${id}`,
    problem: `Problem for ${id}`,
    solution: `Solution for ${id}`,
    business_model: `SaaS for ${id}`,
    traction: `Traction for ${id}`,
    competition: `Competition for ${id}`,
    risks: `Risks for ${id}`,
    strengths: `Strengths for ${id}`,
    why_now: `Why now for ${id}`,
    investment_decision: "INVEST — lead the round.",
    recommendation: "STRONG BUY",
    confidence: 90,
    memo_version: 1,
    created_at: new Date().toISOString(),
    ...overrides,
  } as InvestmentMemoRow);

describe("InvestmentMemosRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports the score threshold constant (85)", () => {
    expect(INVESTMENT_MEMO_SCORE_THRESHOLD).toBe(85);
  });

  // ---- create ----
  it("create(): inserts an investment memo record", async () => {
    const mockRow = makeRow("m-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const result = await repo.create({
      opportunity_id: "opp-m-1",
      venture_report_id: "vr-m-1",
      investment_score_id: "sc-m-1",
      title: "Investment Memo m-1",
      thesis: "T",
      market: "M",
      problem: "P",
      solution: "S",
      business_model: "BM",
      traction: "TR",
      competition: "C",
      risks: "R",
      strengths: "ST",
      why_now: "WN",
      investment_decision: "INVEST",
      recommendation: "STRONG BUY",
      confidence: 90,
    });

    expect(result).toEqual(mockRow);
    expect(mockFrom).toHaveBeenCalledWith("investment_memos");
  });

  // ---- createMany ----
  it("createMany(): returns empty array for empty input", async () => {
    const repo = new InvestmentMemosRepository(mockClient as never);
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

    const repo = new InvestmentMemosRepository(mockClient as never);
    const result = await repo.createMany([
      { opportunity_id: "opp-m-1", venture_report_id: "vr-m-1", investment_score_id: "sc-m-1", title: "A", thesis: "T", market: "M", problem: "P", solution: "S", business_model: "BM", traction: "TR", competition: "C", risks: "R", strengths: "ST", why_now: "WN", investment_decision: "INVEST", recommendation: "STRONG BUY", confidence: 90 },
      { opportunity_id: "opp-m-2", venture_report_id: "vr-m-2", investment_score_id: "sc-m-2", title: "B", thesis: "T", market: "M", problem: "P", solution: "S", business_model: "BM", traction: "TR", competition: "C", risks: "R", strengths: "ST", why_now: "WN", investment_decision: "PASS", recommendation: "PASS", confidence: 30 },
    ]);

    expect(result).toEqual(rows);
  });

  // ---- findByOpportunity ----
  it("findByOpportunity(): returns latest memo for opportunity", async () => {
    const mockRow = makeRow("m-1", { opportunity_id: "opp-m-1" });
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
    };
    mockClient.from = vi.fn().mockReturnValue(chain) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const result = await repo.findByOpportunity("opp-m-1");
    expect(result).toEqual(mockRow);
  });

  // ---- findLatest (alias) ----
  it("findLatest(): delegates to findByOpportunity", async () => {
    const mockRow = makeRow("m-1");
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
    };
    mockClient.from = vi.fn().mockReturnValue(chain) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const result = await repo.findLatest("opp-m-1");
    expect(result).toEqual(mockRow);
  });

  // ---- findById ----
  it("findById(): returns memo by primary key", async () => {
    const mockRow = makeRow("m-1");
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
    };
    mockClient.from = vi.fn().mockReturnValue(chain) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const result = await repo.findById("m-1");
    expect(result).toEqual(mockRow);
  });

  // ---- list ----
  it("list(): returns paginated rows ordered by created_at desc", async () => {
    const rows = [makeRow("m-1"), makeRow("m-2")];
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: rows, error: null }),
    };
    mockClient.from = vi.fn().mockReturnValue(chain) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const result = await repo.list({ limit: 10 });
    expect(result).toEqual(rows);
  });

  it("list(): supports minConfidence and recommendation filters", async () => {
    const rows = [makeRow("m-1")];
    const gte = vi.fn().mockReturnThis();
    const ilike = vi.fn().mockReturnThis();
    const order = vi.fn().mockReturnThis();
    const range = vi.fn().mockResolvedValue({ data: rows, error: null });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      gte,
      ilike,
      order,
      range,
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    await repo.list({ minConfidence: 80, recommendation: "STRONG BUY" });
    expect(gte).toHaveBeenCalledWith("confidence", 80);
    expect(ilike).toHaveBeenCalledWith("recommendation", "STRONG BUY");
  });

  // ---- count ----
  it("count(): returns total record count", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 42, error: null }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    expect(await repo.count()).toBe(42);
  });

  // ---- averageConfidence ----
  it("averageConfidence(): returns 0 when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    expect(await repo.averageConfidence()).toBe(0);
  });

  it("averageConfidence(): computes mean confidence", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ confidence: 80 }, { confidence: 90 }, { confidence: 100 }],
        error: null,
      }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    expect(await repo.averageConfidence()).toBeCloseTo(90);
  });

  // ---- strongBuyCount ----
  it("strongBuyCount(): returns count of STRONG BUY memos", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        ilike: vi.fn().mockResolvedValue({ count: 7, error: null }),
      }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    expect(await repo.strongBuyCount()).toBe(7);
  });

  // ---- getStats ----
  it("getStats(): returns empty stats when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const stats = await repo.getStats();
    expect(stats.total).toBe(0);
    expect(stats.averageConfidence).toBe(0);
    expect(stats.strongBuyCount).toBe(0);
    expect(stats.investorReadyCount).toBe(0);
    expect(stats.latestMemoDate).toBe(null);
  });

  it("getStats(): aggregates total/avg/strong-buy", async () => {
    const rows = [
      makeRow("m-1", { recommendation: "STRONG BUY", confidence: 90 }),
      makeRow("m-2", { recommendation: "STRONG BUY", confidence: 80 }),
      makeRow("m-3", { recommendation: "BUY", confidence: 70 }),
    ];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: rows, error: null }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const stats = await repo.getStats();
    expect(stats.total).toBe(3);
    expect(stats.averageConfidence).toBeCloseTo(80);
    expect(stats.strongBuyCount).toBe(2);
    expect(stats.investorReadyCount).toBe(2);
    expect(stats.latestMemoDate).not.toBe(null);
  });

  // ---- confidenceDistribution ----
  it("getConfidenceDistribution(): buckets records correctly", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ confidence: 10 }, { confidence: 50 }, { confidence: 95 }, { confidence: 88 }],
        error: null,
      }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const buckets = await repo.getConfidenceDistribution();
    const bucketsByName = Object.fromEntries(buckets.map((b) => [b.bucket, b.count]));
    expect(bucketsByName["0-20"]).toBe(1);
    expect(bucketsByName["41-60"]).toBe(1);
    expect(bucketsByName["81-100"]).toBe(2);
  });

  // ---- recommendationBreakdown ----
  it("getRecommendationBreakdown(): groups by recommendation", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { recommendation: "STRONG BUY" },
          { recommendation: "STRONG BUY" },
          { recommendation: "BUY" },
          { recommendation: null },
        ],
        error: null,
      }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const breakdown = await repo.getRecommendationBreakdown();
    expect(breakdown[0].recommendation).toBe("STRONG BUY");
    expect(breakdown[0].count).toBe(2);
    expect(breakdown[1].recommendation).toBe("BUY");
    expect(breakdown[1].count).toBe(1);
  });

  // ---- investmentDecisionBreakdown ----
  it("getInvestmentDecisionBreakdown(): groups by decision", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { investment_decision: "INVEST — lead" },
          { investment_decision: "INVEST — lead" },
          { investment_decision: "PASS" },
        ],
        error: null,
      }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const breakdown = await repo.getInvestmentDecisionBreakdown();
    expect(breakdown[0].decision).toBe("INVEST — lead");
    expect(breakdown[0].count).toBe(2);
    expect(breakdown[1].decision).toBe("PASS");
    expect(breakdown[1].count).toBe(1);
  });

  // ---- history ----
  it("getHistory(): returns per-day history rows", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const chain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { created_at: `${today}T12:00:00Z`, confidence: 80 },
          { created_at: `${today}T13:00:00Z`, confidence: 90 },
          { created_at: `${yesterday}T12:00:00Z`, confidence: 70 },
        ],
        error: null,
      }),
    };
    mockClient.from = vi.fn().mockReturnValue(chain) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const history = await repo.getHistory(30);
    expect(history.length).toBe(2);
    const todayRow = history.find((h) => h.date === today);
    expect(todayRow?.count).toBe(2);
    expect(todayRow?.avgConfidence).toBe(85);
  });

  // ---- search ----
  it("search(): applies recommendation / confidence / decision filters", async () => {
    const rows = [makeRow("m-1")];
    const ilike = vi.fn().mockReturnThis();
    const gte = vi.fn().mockReturnThis();
    const lte = vi.fn().mockReturnThis();
    const or = vi.fn().mockReturnThis();
    const order = vi.fn().mockReturnThis();
    const range = vi.fn().mockResolvedValue({ data: rows, error: null });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      ilike,
      gte,
      lte,
      or,
      order,
      range,
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    await repo.search({
      recommendation: "STRONG BUY",
      minConfidence: 80,
      maxConfidence: 100,
      investmentDecision: "INVEST",
      limit: 10,
    });

    expect(ilike).toHaveBeenCalledWith("recommendation", "STRONG BUY");
    expect(ilike).toHaveBeenCalledWith("investment_decision", "INVEST");
    expect(gte).toHaveBeenCalledWith("confidence", 80);
    expect(lte).toHaveBeenCalledWith("confidence", 100);
  });

  it("search(): applies full-text query across title/thesis/market/...", async () => {
    const rows = [makeRow("m-1")];
    const or = vi.fn().mockReturnThis();
    const order = vi.fn().mockReturnThis();
    const range = vi.fn().mockResolvedValue({ data: rows, error: null });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or,
      order,
      range,
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    await repo.search({ query: "AI workflow", limit: 10 });

    expect(or).toHaveBeenCalledTimes(1);
    const orArg = or.mock.calls[0][0] as string;
    expect(orArg).toContain("title.ilike.%AI workflow%");
    expect(orArg).toContain("thesis.ilike.%AI workflow%");
    expect(orArg).toContain("market.ilike.%AI workflow%");
    expect(orArg).toContain("problem.ilike.%AI workflow%");
    expect(orArg).toContain("solution.ilike.%AI workflow%");
    expect(orArg).toContain("strengths.ilike.%AI workflow%");
  });

  it("searchCount(): returns count for the same filters", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({ count: 3, error: null }),
            }),
          }),
        }),
      }),
    }) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    expect(
      await repo.searchCount({
        recommendation: "STRONG BUY",
        minConfidence: 80,
        maxConfidence: 100,
        query: "AI",
      }),
    ).toBe(3);
  });

  // ---- listCards ----
  it("listCards(): returns joined card data", async () => {
    const cardRow = {
      ...makeRow("m-1"),
      opportunity: {
        id: "opp-m-1",
        title: "Workflow AI",
        pain_cluster: { name: "Cold Outreach" },
      },
      startup_score: { overall_score: 92 },
    };
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [cardRow], error: null }),
    };
    mockClient.from = vi.fn().mockReturnValue(chain) as never;

    const repo = new InvestmentMemosRepository(mockClient as never);
    const cards = await repo.listCards({ limit: 10 });
    expect(cards).toHaveLength(1);
    expect(cards[0].opportunity_title).toBe("Workflow AI");
    expect(cards[0].cluster_name).toBe("Cold Outreach");
    expect(cards[0].overall_score).toBe(92);
  });
});