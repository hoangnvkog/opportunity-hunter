import { describe, it, expect, beforeEach, vi } from "vitest";
import { VentureGtmRepository } from "../venture-gtm.repository";
import type { VentureGtmRow } from "@/types/venture-studio";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<VentureGtmRow> = {},
): VentureGtmRow =>
  ({
    id,
    venture_project_id: `proj-${id}`,
    launch_strategy: `Launch strategy ${id}`,
    acquisition_channels: `Channels ${id}`,
    pricing_strategy: `Pricing ${id}`,
    growth_loops: `Growth loops ${id}`,
    marketing_plan: `Marketing ${id}`,
    sales_plan: `Sales ${id}`,
    created_at: new Date().toISOString(),
    ...overrides,
  } as VentureGtmRow);

describe("VentureGtmRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create(): inserts a GTM record", async () => {
    const mockRow = makeRow("g-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureGtmRepository(mockClient as never);
    const result = await repo.create({
      venture_project_id: "proj-g-1",
      launch_strategy: "Launch strategy g-1",
      acquisition_channels: "Channels g-1",
      pricing_strategy: "Pricing g-1",
      growth_loops: "Growth loops g-1",
      marketing_plan: "Marketing g-1",
      sales_plan: "Sales g-1",
    });

    expect(result.id).toBe("g-1");
    expect(result.venture_project_id).toBe("proj-g-1");
    expect(mockFrom).toHaveBeenCalledWith("venture_gtm");
  });

  it("findByProject(): returns GTM for a project", async () => {
    const mockRow = makeRow("g-2");
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

    const repo = new VentureGtmRepository(mockClient as never);
    const result = await repo.findByProject("proj-g-2");

    expect(result?.id).toBe("g-2");
  });

  it("findByProject(): returns null when not found", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureGtmRepository(mockClient as never);
    const result = await repo.findByProject("nonexistent");

    expect(result).toBeNull();
  });

  it("deleteByProject(): deletes GTM for a project", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureGtmRepository(mockClient as never);
    await repo.deleteByProject("proj-g-3");

    expect(mockFrom).toHaveBeenCalledWith("venture_gtm");
  });

  it("count(): returns total count", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 7, error: null }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureGtmRepository(mockClient as never);
    const result = await repo.count();

    expect(result).toBe(7);
  });
});
