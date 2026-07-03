import { describe, it, expect, beforeEach, vi } from "vitest";
import { VentureProjectsRepository } from "../venture-projects.repository";
import type { VentureProjectRow } from "@/types/venture-studio";

const mockClient = { from: vi.fn() };

const makeRow = (
  id: string,
  overrides: Partial<VentureProjectRow> = {},
): VentureProjectRow =>
  ({
    id,
    opportunity_id: `opp-${id}`,
    startup_idea_id: null,
    name: `Venture Project ${id}`,
    tagline: `Tagline ${id}`,
    status: "ready",
    overall_score: 85,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as VentureProjectRow);

describe("VentureProjectsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create(): inserts a venture project record", async () => {
    const mockRow = makeRow("v-1");
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureProjectsRepository(mockClient as never);
    const result = await repo.create({
      opportunity_id: "opp-v-1",
      name: "Test Venture",
      tagline: "Test tagline",
    });

    expect(result.id).toBe("v-1");
    expect(result.name).toBe("Venture Project v-1");
    expect(mockFrom).toHaveBeenCalledWith("venture_projects");
  });

  it("findById(): returns a venture project", async () => {
    const mockRow = makeRow("v-2");
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureProjectsRepository(mockClient as never);
    const result = await repo.findById("v-2");

    expect(result?.id).toBe("v-2");
  });

  it("findById(): returns null when not found", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureProjectsRepository(mockClient as never);
    const result = await repo.findById("nonexistent");

    expect(result).toBeNull();
  });

  it("update(): updates a venture project record", async () => {
    const mockRow = makeRow("v-3", { status: "archived" });
    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
          }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureProjectsRepository(mockClient as never);
    const result = await repo.update("v-3", { status: "archived" });

    expect(result.status).toBe("archived");
  });

  it("delete(): deletes a venture project record", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureProjectsRepository(mockClient as never);
    await repo.delete("v-4");

    expect(mockFrom).toHaveBeenCalledWith("venture_projects");
  });

  it("list(): returns paginated venture projects", async () => {
    const mockRows = [makeRow("v-1"), makeRow("v-2")];
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
            }),
          }),
        }),
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureProjectsRepository(mockClient as never);
    const result = await repo.list({ limit: 10, status: "ready", minScore: 70 });

    expect(result).toHaveLength(2);
  });

  it("count(): returns total count", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 5, error: null }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureProjectsRepository(mockClient as never);
    const result = await repo.count();

    expect(result).toBe(5);
  });

  it("averageScore(): returns average score", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { overall_score: 80 },
          { overall_score: 90 },
          { overall_score: 70 },
        ],
        error: null,
      }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureProjectsRepository(mockClient as never);
    const result = await repo.averageScore();

    expect(result).toBe(80);
  });

  it("averageScore(): returns 0 for empty table", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    mockClient.from = mockFrom as never;

    const repo = new VentureProjectsRepository(mockClient as never);
    const result = await repo.averageScore();

    expect(result).toBe(0);
  });
});
