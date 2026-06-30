import { describe, it, expect, beforeEach, vi } from "vitest";
import { VentureReportsRepository } from "../venture-reports.repository";
import type { VentureReportRow } from "@/types/venture-report";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<VentureReportRow> = {},
): VentureReportRow =>
  ({
    id,
    opportunity_id: `opp-${id}`,
    startup_score_id: `score-${id}`,
    title: `Venture Report ${id}`,
    executive_summary: `Executive summary ${id}`,
    problem: `Problem ${id}`,
    market_analysis: `Market analysis ${id}`,
    tam_analysis: `TAM analysis ${id}`,
    competition_analysis: `Competition analysis ${id}`,
    customer_segments: `Customer segments ${id}`,
    business_model: `Business model ${id}`,
    pricing_strategy: `Pricing strategy ${id}`,
    go_to_market: `Go to market ${id}`,
    distribution_strategy: `Distribution strategy ${id}`,
    product_roadmap: `Product roadmap ${id}`,
    technical_risks: `Technical risks ${id}`,
    business_risks: `Business risks ${id}`,
    competitive_advantages: `Competitive advantages ${id}`,
    moat_analysis: `Moat analysis ${id}`,
    financial_outlook: `Financial outlook ${id}`,
    recommendation: "Strong Buy",
    confidence: 85,
    report_version: 1,
    created_at: new Date().toISOString(),
    ...overrides,
  } as VentureReportRow);

describe("VentureReportsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- create ----
  it("create(): inserts a venture report record", async () => {
    const mockRow = makeRow("v-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.create({
      opportunity_id: "opp-v-1",
      startup_score_id: "score-v-1",
      title: "Test Report",
      executive_summary: "Summary",
      problem: "Problem",
      market_analysis: "Market",
      tam_analysis: "TAM",
      competition_analysis: "Competition",
      customer_segments: "Customers",
      business_model: "Model",
      pricing_strategy: "Pricing",
      go_to_market: "GTM",
      distribution_strategy: "Distribution",
      product_roadmap: "Roadmap",
      technical_risks: "Tech risks",
      business_risks: "Biz risks",
      competitive_advantages: "Advantages",
      moat_analysis: "Moat",
      financial_outlook: "Financial",
      recommendation: "Strong Buy",
      confidence: 85,
    });

    expect(result).toEqual(mockRow);
    expect(mockFrom).toHaveBeenCalledWith("venture_reports");
  });

  // ---- createMany ----
  it("createMany(): returns empty array for empty input", async () => {
    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.createMany([]);
    expect(result).toEqual([]);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("createMany(): inserts multiple records", async () => {
    const rows = [makeRow("v-1"), makeRow("v-2")];
    mockClient.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.createMany([
      {
        opportunity_id: "opp-1",
        startup_score_id: "score-1",
        title: "Report 1",
        executive_summary: "Summary 1",
        problem: "Problem 1",
        market_analysis: "Market 1",
        tam_analysis: "TAM 1",
        competition_analysis: "Competition 1",
        customer_segments: "Customers 1",
        business_model: "Model 1",
        pricing_strategy: "Pricing 1",
        go_to_market: "GTM 1",
        distribution_strategy: "Distribution 1",
        product_roadmap: "Roadmap 1",
        technical_risks: "Tech risks 1",
        business_risks: "Biz risks 1",
        competitive_advantages: "Advantages 1",
        moat_analysis: "Moat 1",
        financial_outlook: "Financial 1",
        recommendation: "Strong Buy",
        confidence: 85,
      },
      {
        opportunity_id: "opp-2",
        startup_score_id: "score-2",
        title: "Report 2",
        executive_summary: "Summary 2",
        problem: "Problem 2",
        market_analysis: "Market 2",
        tam_analysis: "TAM 2",
        competition_analysis: "Competition 2",
        customer_segments: "Customers 2",
        business_model: "Model 2",
        pricing_strategy: "Pricing 2",
        go_to_market: "GTM 2",
        distribution_strategy: "Distribution 2",
        product_roadmap: "Roadmap 2",
        technical_risks: "Tech risks 2",
        business_risks: "Biz risks 2",
        competitive_advantages: "Advantages 2",
        moat_analysis: "Moat 2",
        financial_outlook: "Financial 2",
        recommendation: "Watch",
        confidence: 75,
      },
    ]);
    expect(result).toEqual(rows);
  });

  // ---- findByOpportunity ----
  it("findByOpportunity(): returns a row", async () => {
    const row = makeRow("v-1", { opportunity_id: "opp-1" });
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

    const repo = new VentureReportsRepository(mockClient as never);
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

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.findByOpportunity("opp-x");
    expect(result).toBeNull();
  });

  // ---- findLatest (alias) ----
  it("findLatest(): returns latest row for opportunity", async () => {
    const row = makeRow("v-1", { opportunity_id: "opp-1" });
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

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.findLatest("opp-1");
    expect(result).toEqual(row);
  });

  // ---- list ----
  it("list(): returns paginated rows sorted by created_at desc by default", async () => {
    const rows = [makeRow("v-1"), makeRow("v-2")];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.list({ limit: 10 });
    expect(result).toEqual(rows);
  });

  it("list(): filters by minConfidence", async () => {
    const rows = [makeRow("v-1")];
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

    const repo = new VentureReportsRepository(mockClient as never);
    await repo.list({ minConfidence: 80 });
    expect(gteMock).toHaveBeenCalledWith("confidence", 80);
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

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.count();
    expect(result).toBe(42);
  });

  // ---- averageConfidence ----
  it("averageConfidence(): returns average confidence", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ confidence: 70 }, { confidence: 90 }],
        error: null,
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.averageConfidence();
    expect(result).toBe(80);
  });

  it("averageConfidence(): returns 0 when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
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

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.investmentGradeCount(80);
    expect(result).toBe(5);
  });

  it("investmentGradeCount(): uses default threshold 80", async () => {
    const gteMock = vi.fn().mockResolvedValue({ count: 3, error: null });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: gteMock,
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    await repo.investmentGradeCount();
    expect(gteMock).toHaveBeenCalledWith("confidence", 80);
  });

  // ---- strongBuyCount ----
  it("strongBuyCount(): returns count of STRONG BUY recommendations", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        ilike: vi.fn().mockResolvedValue({ count: 4, error: null }),
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.strongBuyCount();
    expect(result).toBe(4);
  });

  // ---- latestReportDate ----
  it("latestReportDate(): returns latest created_at", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { created_at: "2026-06-30T10:00:00Z" },
              error: null,
            }),
          }),
        }),
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.latestReportDate();
    expect(result).toBe("2026-06-30T10:00:00Z");
  });

  it("latestReportDate(): returns null when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.latestReportDate();
    expect(result).toBeNull();
  });

  // ---- listCards ----
  it("listCards(): returns joined data with opportunity, cluster, and startup_score", async () => {
    const mockRows = [
      {
        id: "v-1",
        opportunity_id: "opp-1",
        startup_score_id: "score-1",
        title: "Report 1",
        executive_summary: "Summary 1",
        problem: "Problem 1",
        market_analysis: "Market 1",
        tam_analysis: "TAM 1",
        competition_analysis: "Competition 1",
        customer_segments: "Customers 1",
        business_model: "Model 1",
        pricing_strategy: "Pricing 1",
        go_to_market: "GTM 1",
        distribution_strategy: "Distribution 1",
        product_roadmap: "Roadmap 1",
        technical_risks: "Tech risks 1",
        business_risks: "Biz risks 1",
        competitive_advantages: "Advantages 1",
        moat_analysis: "Moat 1",
        financial_outlook: "Financial 1",
        recommendation: "Strong Buy",
        confidence: 85,
        report_version: 1,
        created_at: "2026-06-30T10:00:00Z",
        opportunity: { id: "opp-1", title: "Opportunity 1", pain_cluster: { name: "Cluster A" } },
        startup_score: { overall_score: 92, recommendation: "Strong Invest" },
      },
      {
        id: "v-2",
        opportunity_id: "opp-2",
        startup_score_id: "score-2",
        title: "Report 2",
        executive_summary: "Summary 2",
        problem: "Problem 2",
        market_analysis: "Market 2",
        tam_analysis: "TAM 2",
        competition_analysis: "Competition 2",
        customer_segments: "Customers 2",
        business_model: "Model 2",
        pricing_strategy: "Pricing 2",
        go_to_market: "GTM 2",
        distribution_strategy: "Distribution 2",
        product_roadmap: "Roadmap 2",
        technical_risks: "Tech risks 2",
        business_risks: "Biz risks 2",
        competitive_advantages: "Advantages 2",
        moat_analysis: "Moat 2",
        financial_outlook: "Financial 2",
        recommendation: "Watch",
        confidence: 75,
        report_version: 1,
        created_at: "2026-06-29T10:00:00Z",
        opportunity: { id: "opp-2", title: "Opportunity 2", pain_cluster: null },
        startup_score: { overall_score: 78, recommendation: "Watch" },
      },
    ];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
        }),
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.listCards({ limit: 2 });

    expect(result).toHaveLength(2);
    expect(result[0].opportunity_title).toBe("Opportunity 1");
    expect(result[0].cluster_name).toBe("Cluster A");
    expect(result[0].overall_score).toBe(92);
    expect(result[1].cluster_name).toBeNull();
    expect(result[1].overall_score).toBe(78);
  });

  // ---- getStats ----
  it("getStats(): returns aggregate stats", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          makeRow("v-1", { confidence: 85, recommendation: "Strong Buy" }),
          makeRow("v-2", { confidence: 75, recommendation: "Watch" }),
        ],
        error: null,
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.getStats();

    expect(result.total).toBe(2);
    expect(result.averageConfidence).toBe(80);
    expect(result.investmentGradeCount).toBe(1); // only v-1 >= 80
    expect(result.strongBuyCount).toBe(1);
    expect(result.latestReportDate).toBeTruthy();
  });

  it("getStats(): returns zeros when no records", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.getStats();
    expect(result.total).toBe(0);
    expect(result.averageConfidence).toBe(0);
    expect(result.investmentGradeCount).toBe(0);
    expect(result.strongBuyCount).toBe(0);
    expect(result.latestReportDate).toBeNull();
  });

  // ---- getConfidenceDistribution ----
  it("getConfidenceDistribution(): returns 5 buckets by confidence range", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { confidence: 10 },
          { confidence: 30 },
          { confidence: 50 },
          { confidence: 70 },
          { confidence: 95 },
        ],
        error: null,
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.getConfidenceDistribution();

    expect(result).toHaveLength(5);
    expect(result.find((b) => b.bucket === "0-20")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "21-40")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "41-60")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "61-80")?.count).toBe(1);
    expect(result.find((b) => b.bucket === "81-100")?.count).toBe(1);
  });

  // ---- getRecommendationBreakdown ----
  it("getRecommendationBreakdown(): returns counts by recommendation", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { recommendation: "Strong Buy" },
          { recommendation: "Watch" },
          { recommendation: "Watch" },
          { recommendation: "Pass" },
          { recommendation: null },
        ],
        error: null,
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.getRecommendationBreakdown();

    expect(result).toEqual([
      { recommendation: "Watch", count: 2 },
      { recommendation: "Strong Buy", count: 1 },
      { recommendation: "Pass", count: 1 },
      { recommendation: "Unknown", count: 1 },
    ]);
  });

  // ---- getHistory ----
  it("getHistory(): groups records by date and computes avgConfidence", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { created_at: "2026-06-28T10:00:00Z", confidence: 70 },
              { created_at: "2026-06-28T15:00:00Z", confidence: 90 },
              { created_at: "2026-06-29T10:00:00Z", confidence: 80 },
            ],
            error: null,
          }),
        }),
      }),
    }) as never;

    const repo = new VentureReportsRepository(mockClient as never);
    const result = await repo.getHistory(30);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-06-28");
    expect(result[0].count).toBe(2);
    expect(result[0].avgConfidence).toBe(80);
    expect(result[1].date).toBe("2026-06-29");
    expect(result[1].count).toBe(1);
    expect(result[1].avgConfidence).toBe(80);
  });
});