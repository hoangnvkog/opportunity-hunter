import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/venture-score/batch/route";
import { batchCalculateVentureScores } from "@/services/venture-score/venture-score.service";

vi.mock("@/services/venture-score/venture-score.service", () => ({
  batchCalculateVentureScores: vi.fn(),
}));

describe("POST /api/venture-score/batch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with batch result", async () => {
    vi.mocked(batchCalculateVentureScores).mockResolvedValue({
      processed: 50,
      calculated: 30,
      skipped: 20,
    } as never);
    const res = await POST();
    expect(res.status).toBe(200);
  });

  it("returns 500 on service error", async () => {
    vi.mocked(batchCalculateVentureScores).mockRejectedValue(new Error("DB"));
    const res = await POST();
    expect(res.status).toBe(500);
  });
});