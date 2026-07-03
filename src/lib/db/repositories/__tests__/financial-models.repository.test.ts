import { describe, it, expect, beforeEach, vi } from "vitest";
import { FinancialModelsRepository } from "../financial-models.repository";
import type { FinancialModelRow } from "@/types/financial";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<FinancialModelRow> = {},
): FinancialModelRow =>
  ({
    id,
    venture_project_id: `proj-${id}`,
    currency: "USD",
    projection_years: 5,
    assumptions: { averagePrice: 99, conversionRate: 0.03, monthlyGrowthRate: 0.08, churnRate: 0.05, grossMargin: 0.75, cac: 120, supportCost: 5000, hostingCost: 2000, payroll: 80000, marketingBudget: 10000, salesCost: 15000, infrastructure: 3000 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as FinancialModelRow);

describe("FinancialModelsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create(): inserts a financial model", async () => {
    const mockRow = makeRow("fm-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new FinancialModelsRepository(mockClient as never);
    const result = await repo.create({
      venture_project_id: "proj-fm-1",
      currency: "USD",
      projection_years: 5,
      assumptions: { averagePrice: 99, conversionRate: 0.03, monthlyGrowthRate: 0.08, churnRate: 0.05, grossMargin: 0.75, cac: 120, supportCost: 5000, hostingCost: 2000, payroll: 80000, marketingBudget: 10000, salesCost: 15000, infrastructure: 3000 },
    });

    expect(result.id).toBe("fm-1");
    expect(result.currency).toBe("USD");
    expect(mockFrom).toHaveBeenCalledWith("financial_models");
  });

  it("findById(): returns a financial model", async () => {
    const mockRow = makeRow("fm-2");
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new FinancialModelsRepository(mockClient as never);
    const result = await repo.findById("fm-2");

    expect(result?.id).toBe("fm-2");
  });

  it("findByVentureProject(): returns model for a project", async () => {
    const mockRow = makeRow("fm-3");
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
            }),
          }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new FinancialModelsRepository(mockClient as never);
    const result = await repo.findByVentureProject("proj-fm-3");

    expect(result?.venture_project_id).toBe("proj-fm-3");
  });

  it("count(): returns total count", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 12, error: null }),
    });
    mockClient.from = mockFrom as never;

    const repo = new FinancialModelsRepository(mockClient as never);
    const result = await repo.count();

    expect(result).toBe(12);
  });

  it("delete(): deletes a financial model", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new FinancialModelsRepository(mockClient as never);
    await repo.delete("fm-4");

    expect(mockFrom).toHaveBeenCalledWith("financial_models");
  });
});
