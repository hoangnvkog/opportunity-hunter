import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpportunityForecastsRepository } from "../opportunity-forecasts.repository";
import type { OpportunityForecastRow } from "@/types/forecast";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<OpportunityForecastRow> = {},
): OpportunityForecastRow =>
  ({
    id,
    opportunity_id: `opp-${id}`,
    forecast_score: 88,
    growth_probability: 80,
    confidence: 85,
    momentum: 75,
    prediction_summary: `Forecast ${id}`,
    forecast_window_days: 30,
    created_at: new Date().toISOString(),
    ...overrides,
  } as OpportunityForecastRow);

function chain(value: unknown) {
  const obj: Record<string, unknown> = {};
  const proxy = new Proxy(obj, {
    get(_t, prop) {
      if (prop === "then") return undefined; // not a promise
      if (typeof prop === "string") {
        return (..._args: unknown[]) => chain(value);
      }
      return undefined;
    },
  });
  // Allow callable + terminal: set up the last call to resolve
  const result: unknown = value;
  const handler: ProxyHandler<object> = {
    get(t, prop) {
      if (typeof prop === "symbol") return (t as Record<symbol, unknown>)[prop];
      if (prop === "then") return (cb: (v: unknown) => void) => Promise.resolve(result).then(cb);
      // Chainable methods
      return (..._args: unknown[]) => proxy;
    },
  };
  const p = new Proxy(function () {}, handler) as unknown as Record<string, unknown>;
  p.then = undefined as never;
  return p;
}

describe("OpportunityForecastsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- create ----
  it("create(): inserts a forecast record", async () => {
    const mockRow = makeRow("f-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.create({
      opportunity_id: "opp-f-1",
      forecast_score: 90,
      growth_probability: 85,
      confidence: 80,
      momentum: 75,
      prediction_summary: "Strong growth",
    });

    expect(result).toEqual(mockRow);
    expect(mockFrom).toHaveBeenCalledWith("opportunity_forecasts");
  });

  // ---- createMany ----
  it("createMany(): returns empty array for empty input", async () => {
    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.createMany([]);
    expect(result).toEqual([]);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("createMany(): inserts multiple records", async () => {
    const rows = [makeRow("f-1"), makeRow("f-2")];
    mockClient.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.createMany([
      {
        opportunity_id: "opp-1",
        forecast_score: 80,
        growth_probability: 75,
        confidence: 70,
        momentum: 65,
        prediction_summary: "a",
      },
      {
        opportunity_id: "opp-2",
        forecast_score: 90,
        growth_probability: 85,
        confidence: 80,
        momentum: 75,
        prediction_summary: "b",
      },
    ]);
    expect(result).toEqual(rows);
  });

  // ---- findByOpportunity ----
  it("findByOpportunity(): returns a row", async () => {
    const mockRow = makeRow("f-1");
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
            }),
          }),
        }),
      }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.findByOpportunity("opp-1");
    expect(result).toEqual(mockRow);
    expect(result?.id).toBe("f-1");
  });

  it("findByOpportunity(): returns null when not found", async () => {
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

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.findByOpportunity("opp-missing");
    expect(result).toBeNull();
  });

  // ---- list ----
  it("list(): orders by forecast_score DESC by default", async () => {
    const rows = [makeRow("f-1"), makeRow("f-2")];
    const order = vi.fn().mockReturnValue({
      range: vi.fn().mockResolvedValue({ data: rows, error: null }),
    });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ order }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.list({ limit: 10 });
    expect(result).toEqual(rows);
    expect(order).toHaveBeenCalledWith("forecast_score", { ascending: false });
  });

  it("list(): filters by minScore when provided", async () => {
    const order = vi.fn().mockReturnValue({
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    const gte = vi.fn().mockReturnValue({ order });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ gte }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    await repo.list({ minScore: 90 });
    expect(gte).toHaveBeenCalledWith("forecast_score", 90);
  });

  // ---- listTopForecasts ----
  it("listTopForecasts(): delegates to list with sorted limit", async () => {
    const rows = [makeRow("f-1")];
    const order = vi.fn().mockReturnValue({
      range: vi.fn().mockResolvedValue({ data: rows, error: null }),
    });
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ order }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.listTopForecasts(5);
    expect(result).toEqual(rows);
    expect(order).toHaveBeenCalledWith("forecast_score", { ascending: false });
  });

  // ---- deleteByOpportunity ----
  it("deleteByOpportunity(): deletes and returns count", async () => {
    const countEq = vi.fn().mockResolvedValue({ count: 4, error: null });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "opportunity_forecasts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: countEq,
          }),
          delete: vi.fn().mockReturnValue({
            eq: deleteEq,
          }),
        };
      }
      return {};
    });
    mockClient.from = mockFrom as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.deleteByOpportunity("opp-1");
    expect(result).toBe(4);
    expect(deleteEq).toHaveBeenCalledWith("opportunity_id", "opp-1");
  });

  it("deleteByOpportunity(): returns 0 when no forecasts", async () => {
    const countEq = vi.fn().mockResolvedValue({ count: 0, error: null });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });

    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: countEq }),
      delete: vi.fn().mockReturnValue({ eq: deleteEq }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.deleteByOpportunity("opp-empty");
    expect(result).toBe(0);
  });

  // ---- count ----
  it("count(): returns total number", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 42, error: null }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.count();
    expect(result).toBe(42);
  });

  it("count(): returns 0 when empty", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 0, error: null }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.count();
    expect(result).toBe(0);
  });

  // ---- averageForecastScore ----
  it("averageForecastScore(): computes average", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { forecast_score: 80, growth_probability: 0, confidence: 0, momentum: 0 },
          { forecast_score: 90, growth_probability: 0, confidence: 0, momentum: 0 },
        ],
        error: null,
      }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.averageForecastScore();
    expect(result).toBe(85);
  });

  it("averageForecastScore(): returns 0 when empty", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.averageForecastScore();
    expect(result).toBe(0);
  });

  it("averageGrowthProbability(): computes average", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ growth_probability: 60 }, { growth_probability: 80 }],
        error: null,
      }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.averageGrowthProbability();
    expect(result).toBe(70);
  });

  it("averageConfidence(): computes average", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ confidence: 70 }, { confidence: 80 }, { confidence: 90 }],
        error: null,
      }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.averageConfidence();
    expect(result).toBe(80);
  });

  it("averageMomentum(): computes average", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ momentum: 50 }, { momentum: 70 }],
        error: null,
      }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.averageMomentum();
    expect(result).toBe(60);
  });

  // ---- topForecastScore ----
  it("topForecastScore(): returns highest score", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ forecast_score: 95 }], error: null }),
        }),
      }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.topForecastScore();
    expect(result).toBe(95);
  });

  it("topForecastScore(): returns 0 when empty", async () => {
    mockClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const result = await repo.topForecastScore();
    expect(result).toBe(0);
  });

  // ---- getStats ----
  it("getStats(): aggregates all metrics", async () => {
    // count() → 10
    // averageForecastScore() → 80
    // averageGrowthProbability() → 75
    // averageConfidence() → 70
    // averageMomentum() → 65
    // topForecastScore() → 95
    mockClient.from = vi
      .fn()
      .mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({ count: 10, error: null }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: [
            { forecast_score: 80, growth_probability: 0, confidence: 0, momentum: 0 },
            { forecast_score: 80, growth_probability: 0, confidence: 0, momentum: 0 },
          ],
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: [{ growth_probability: 75 }, { growth_probability: 75 }],
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: [{ confidence: 70 }, { confidence: 70 }],
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          data: [{ momentum: 65 }, { momentum: 65 }],
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [{ forecast_score: 95 }], error: null }),
          }),
        }),
      })) as never;

    const repo = new OpportunityForecastsRepository(mockClient as never);
    const stats = await repo.getStats();

    expect(stats.total).toBe(10);
    expect(stats.averageForecastScore).toBe(80);
    expect(stats.averageGrowthProbability).toBe(75);
    expect(stats.averageConfidence).toBe(70);
    expect(stats.averageMomentum).toBe(65);
    expect(stats.topForecastScore).toBe(95);
  });
});
