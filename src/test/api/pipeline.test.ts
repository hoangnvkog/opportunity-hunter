import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/pipeline/route";
import { runPipeline } from "@/services/pipeline";

vi.mock("@/services/pipeline", () => ({
  runPipeline: vi.fn(),
}));

describe("POST /api/pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with pipeline result on success", async () => {
    const mockResult = {
      sources: 3,
      rawPosts: 50,
      painPoints: 120,
      embeddings: 120,
      clusters: 15,
      opportunities: 12,
      ideas: 10,
      averageClusterSize: 8,
      largestClusterSize: 20,
    };

    vi.mocked(runPipeline).mockResolvedValue(mockResult as any);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.result).toEqual(mockResult);
    expect(runPipeline).toHaveBeenCalled();
  });

  it("should return 500 on error", async () => {
    vi.mocked(runPipeline).mockRejectedValue(new Error("Pipeline failed"));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Pipeline failed");
  });

  it("should handle unknown errors", async () => {
    vi.mocked(runPipeline).mockRejectedValue("Unknown error");

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Pipeline execution failed");
  });
});
