import { describe, it, expect, beforeEach, vi } from "vitest";
import { VentureCanvasRepository } from "../venture-canvas.repository";
import type { VentureCanvasRow } from "@/types/venture-studio";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<VentureCanvasRow> = {},
): VentureCanvasRow =>
  ({
    id,
    venture_project_id: `proj-${id}`,
    problem: `Problem ${id}`,
    solution: `Solution ${id}`,
    value_proposition: `VP ${id}`,
    customer_segments: `Segments ${id}`,
    channels: `Channels ${id}`,
    customer_relationships: `CR ${id}`,
    key_activities: `Activities ${id}`,
    key_resources: `Resources ${id}`,
    key_partners: `Partners ${id}`,
    cost_structure: `Costs ${id}`,
    revenue_streams: `Revenue ${id}`,
    created_at: new Date().toISOString(),
    ...overrides,
  } as VentureCanvasRow);

describe("VentureCanvasRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create(): inserts a canvas record", async () => {
    const mockRow = makeRow("c-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureCanvasRepository(mockClient as never);
    const result = await repo.create({
      venture_project_id: "proj-c-1",
      problem: "Problem c-1",
      solution: "Solution c-1",
      value_proposition: "VP c-1",
      customer_segments: "Segments c-1",
      channels: "Channels c-1",
      customer_relationships: "CR c-1",
      key_activities: "Activities c-1",
      key_resources: "Resources c-1",
      key_partners: "Partners c-1",
      cost_structure: "Costs c-1",
      revenue_streams: "Revenue c-1",
    });

    expect(result.id).toBe("c-1");
    expect(mockFrom).toHaveBeenCalledWith("venture_canvas");
  });

  it("findByProject(): returns canvas for a project", async () => {
    const mockRow = makeRow("c-2");
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

    const repo = new VentureCanvasRepository(mockClient as never);
    const result = await repo.findByProject("proj-c-2");

    expect(result?.id).toBe("c-2");
    expect(result?.venture_project_id).toBe("proj-c-2");
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

    const repo = new VentureCanvasRepository(mockClient as never);
    const result = await repo.findByProject("nonexistent");

    expect(result).toBeNull();
  });

  it("deleteByProject(): deletes canvas for a project", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureCanvasRepository(mockClient as never);
    await repo.deleteByProject("proj-c-3");

    expect(mockFrom).toHaveBeenCalledWith("venture_canvas");
  });

  it("count(): returns total count", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 3, error: null }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureCanvasRepository(mockClient as never);
    const result = await repo.count();

    expect(result).toBe(3);
  });
});
