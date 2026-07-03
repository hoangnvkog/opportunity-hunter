import { describe, it, expect, beforeEach, vi } from "vitest";
import { VentureMvpRepository } from "../venture-mvp.repository";
import type { VentureMvpRow } from "@/types/venture-studio";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<VentureMvpRow> = {},
): VentureMvpRow =>
  ({
    id,
    venture_project_id: `proj-${id}`,
    core_features: `Core features ${id}`,
    roadmap: `Roadmap ${id}`,
    tech_stack: `Tech stack ${id}`,
    estimated_cost: `$15,000-${id}`,
    estimated_time: `3 months ${id}`,
    risks: `Risks ${id}`,
    created_at: new Date().toISOString(),
    ...overrides,
  } as VentureMvpRow);

describe("VentureMvpRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create(): inserts an MVP record", async () => {
    const mockRow = makeRow("m-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureMvpRepository(mockClient as never);
    const result = await repo.create({
      venture_project_id: "proj-m-1",
      core_features: "Core features m-1",
      roadmap: "Roadmap m-1",
      tech_stack: "Tech stack m-1",
      estimated_cost: "$15,000-m-1",
      estimated_time: "3 months m-1",
      risks: "Risks m-1",
    });

    expect(result.id).toBe("m-1");
    expect(result.venture_project_id).toBe("proj-m-1");
    expect(mockFrom).toHaveBeenCalledWith("venture_mvp");
  });

  it("findByProject(): returns MVP for a project", async () => {
    const mockRow = makeRow("m-2");
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

    const repo = new VentureMvpRepository(mockClient as never);
    const result = await repo.findByProject("proj-m-2");

    expect(result?.id).toBe("m-2");
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

    const repo = new VentureMvpRepository(mockClient as never);
    const result = await repo.findByProject("nonexistent");

    expect(result).toBeNull();
  });

  it("deleteByProject(): deletes MVP for a project", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureMvpRepository(mockClient as never);
    await repo.deleteByProject("proj-m-3");

    expect(mockFrom).toHaveBeenCalledWith("venture_mvp");
  });

  it("count(): returns total count", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 4, error: null }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureMvpRepository(mockClient as never);
    const result = await repo.count();

    expect(result).toBe(4);
  });
});
