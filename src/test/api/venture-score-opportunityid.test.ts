import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/venture-score/[opportunityId]/route";
import { getVentureScoreDetail } from "@/services/venture-score/venture-score.service";

vi.mock("@/services/venture-score/venture-score.service", () => ({
  getVentureScoreDetail: vi.fn(),
}));

describe("GET /api/venture-score/[opportunityId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with venture score detail", async () => {
    vi.mocked(getVentureScoreDetail).mockResolvedValue({
      overallScore: 85,
      dimensionScores: {},
    } as never);
    const req = new Request("http://localhost/api/venture-score/opp-1");
    const res = await GET(req as never, {
      params: Promise.resolve({ opportunityId: "opp-1" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 500 on service error", async () => {
    vi.mocked(getVentureScoreDetail).mockRejectedValue(new Error("DB"));
    const req = new Request("http://localhost/api/venture-score/opp-1");
    const res = await GET(req as never, {
      params: Promise.resolve({ opportunityId: "opp-1" }),
    });
    expect(res.status).toBe(500);
  });
});