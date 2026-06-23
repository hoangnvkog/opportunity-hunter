import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/pipeline/run/route";
import { runFullPipeline } from "@/services/pipeline/run-full-pipeline.service";

vi.mock("@/services/pipeline/run-full-pipeline.service", () => ({
  runFullPipeline: vi.fn(),
}));

describe("POST /api/pipeline/run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with pipeline stats on success", async () => {
    const mockStats = {
      postsFetched: 50,
      painPoints: { processed: 50, extracted: 120, skipped: 0, inserted: 120 },
      clusters: { processed: 120, clustered: 15, skipped: 0, inserted: 15 },
      opportunities: { processed: 15, generated: 12, skipped: 0, inserted: 12 },
      ideas: { processed: 12, generated: 10, skipped: 0, inserted: 10 },
      durationMs: 15000,
    };

    vi.mocked(runFullPipeline).mockResolvedValue(mockStats as any);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats).toEqual(mockStats);
    expect(runFullPipeline).toHaveBeenCalled();
  });

  it("should return 409 when pipeline already running", async () => {
    vi.mocked(runFullPipeline).mockRejectedValue(new Error("Pipeline already running"));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Pipeline already running");
  });

  it("should return 500 on other errors", async () => {
    vi.mocked(runFullPipeline).mockRejectedValue(new Error("Database connection failed"));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toContain("Pipeline execution failed");
    expect(data.message).toContain("Database connection failed");
  });
});
