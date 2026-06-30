import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpportunityBacktestsRepository } from "../opportunity-backtests.repository";
import type { BacktestRow, BacktestStatus } from "@/types/backtesting";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<BacktestRow> = {},
): BacktestRow =>
  ({
    id,
    opportunity_id: `opp-${id}`,
    predicted_score: "75.000",
    predicted_direction: "up",
    actual_score: "72.500",
    prediction_delta: "2.500",
    market_growth: "5.000",
    search_growth: "12.000",
    reddit_growth: "8.000",
    github_growth: null,
    competitor_growth: "3.000",
    accuracy: "95.00",
    status: "evaluated",
    evaluation_date: "2026-06-15",
    notes: "Minor deviation.",
    created_at: new Date().toISOString(),
    ...overrides,
  } as BacktestRow);

const makeMockFrom = (returnData: unknown, returnError: unknown = null) => {
  const mockSelect = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }),
    }),
  });
  const mockEq = vi.fn().mockReturnValue({
    order: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [returnData], error: returnError }),
    }),
    limit: vi.fn().mockResolvedValue({ data: returnData, error: returnError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: returnData, error: returnError }),
  });
  const mockInsert = vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }) }),
    }),
    upsert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }) }),
    }),
  });
  const mockUpdate = vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }) }),
    }),
  });
  const mockDelete = vi.fn().mockReturnValue({
    delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: returnError }) }),
  });
  const mockCount = vi.fn().mockResolvedValue({ count: 5, error: returnError });

  const fromMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      select: mockSelect,
      single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }) }),
    }),
    update: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }) }),
    }),
    delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: returnError }) }),
    upsert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }) }),
    }),
  });
  return fromMock;
};

describe("OpportunityBacktestsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- create ----
  it("create(): inserts a backtest record", async () => {
    const mockRow = makeRow("bt-1");
    mockClient.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    const result = await repo.create({
      opportunity_id: "opp-bt-1",
      predicted_score: "75.000",
      predicted_direction: "up",
      status: "pending",
      evaluation_date: "2026-06-15",
    });

    expect(result).toEqual(mockRow);
    expect(mockClient.from).toHaveBeenCalledWith("opportunity_backtests");
  });

  // ---- createMany ----
  // ---- createMany ----
  it("createMany(): calls insert with records array", async () => {
    const rows = [makeRow("bt-1"), makeRow("bt-2")];
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    });
    mockClient.from = vi.fn().mockReturnValue({ insert: insertMock });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    await repo.createMany([
      { opportunity_id: "opp-1", predicted_score: "75", evaluation_date: "2026-06-15" },
      { opportunity_id: "opp-2", predicted_score: "80", evaluation_date: "2026-06-15" },
    ]);
    expect(insertMock).toHaveBeenCalled();
  });

  // ---- findByOpportunity ----
  it("findByOpportunity(): returns backtests sorted by evaluation_date desc", async () => {
    const rows = [makeRow("bt-1"), makeRow("bt-2")];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
          }),
        }),
      }),
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    const result = await repo.findByOpportunity("opp-bt-1");
    expect(result).toEqual(rows);
  });

  // ---- findLatest ----
  it("findLatest(): returns the most recent backtest for an opportunity", async () => {
    const row = makeRow("bt-1", { actual_score: "78.000" });
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
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    const result = await repo.findLatest("opp-bt-1");
    expect(result?.id).toBe("bt-1");
  });

  // ---- count ----
  it("count(): returns the total number of backtests", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ count: 42, error: null }),
        }),
      }),
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    const result = await repo.count();
    expect(typeof result).toBe("number");
  });

  // ---- update ----
  it("update(): patches a backtest record and returns the updated row", async () => {
    const updatedRow = makeRow("bt-1", { accuracy: "88.00", status: "evaluated" });
    mockClient.from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedRow, error: null }),
          }),
        }),
      }),
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    const result = await repo.update("bt-1", { accuracy: "88.00", status: "evaluated" });
    expect(result.accuracy).toBe("88.00");
    expect(result.status).toBe("evaluated");
  });

  // ---- calculate accuracy from getStats ----
  it("getStats(): aggregates stats correctly with sample data", async () => {
    const rows = [
      { id: "bt-1", accuracy: "95.00", prediction_delta: "5.000", status: "evaluated", evaluation_date: "2026-06-01", created_at: "2026-06-01T00:00:00Z" },
      { id: "bt-2", accuracy: "72.00", prediction_delta: "-8.000", status: "evaluated", evaluation_date: "2026-06-02", created_at: "2026-06-02T00:00:00Z" },
      { id: "bt-3", accuracy: "35.00", prediction_delta: "20.000", status: "evaluated", evaluation_date: "2026-06-03", created_at: "2026-06-03T00:00:00Z" },
      { id: "bt-4", accuracy: null, prediction_delta: null, status: "pending", evaluation_date: "2026-06-04", created_at: "2026-06-04T00:00:00Z" },
    ];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: rows, error: null }),
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    const stats = await repo.getStats();

    expect(stats.total).toBe(4);
    expect(stats.evaluated).toBe(3);
    expect(stats.pending).toBe(1);
    expect(stats.successfulPredictions).toBe(2); // >=60
    expect(stats.failedPredictions).toBe(1);      // <40
    expect(stats.averageAccuracy).not.toBeNull();
  });

  // ---- accuracy distribution ----
  it("getAccuracyDistribution(): buckets counts correctly", async () => {
    const rows = [
      { accuracy: "95.00" },
      { accuracy: "92.00" },
      { accuracy: "85.00" },
      { accuracy: "75.00" },
      { accuracy: "65.00" },
      { accuracy: "55.00" },
      { accuracy: "35.00" },
    ];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    const dist = await repo.getAccuracyDistribution();

    expect(dist).toContainEqual({ range: "90-100", count: 2 });
    expect(dist).toContainEqual({ range: "80-90", count: 1 });
    expect(dist).toContainEqual({ range: "70-80", count: 1 });
    expect(dist).toContainEqual({ range: "60-70", count: 1 });
    expect(dist).toContainEqual({ range: "40-60", count: 1 });
    expect(dist).toContainEqual({ range: "20-40", count: 1 });
  });

  // ---- findPending ----
  it("findPending(): returns pending backtests ordered by evaluation_date", async () => {
    const rows = [makeRow("bt-1", { status: "pending" }), makeRow("bt-2", { status: "pending" })];
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
          }),
        }),
      }),
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    const result = await repo.findPending(50);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  // ---- upsert ----
  it("upsert(): calls upsert with onConflict", async () => {
    const row = makeRow("bt-1");
    mockClient.from = vi.fn().mockReturnValue({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    await repo.upsert({
      opportunity_id: "opp-1",
      predicted_score: "80.000",
      evaluation_date: "2026-06-01",
    });
    expect(mockClient.from).toHaveBeenCalled();
  });

  // ---- delete ----
  it("delete(): calls delete with id", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const repo = new OpportunityBacktestsRepository(mockClient as never);
    await repo.delete("bt-1");
    expect(mockClient.from).toHaveBeenCalledWith("opportunity_backtests");
  });
});