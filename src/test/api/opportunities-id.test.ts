import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "@/app/api/opportunities/[id]/route";
import { getOpportunityById } from "@/services/opportunities";

vi.mock("@/services/opportunities", () => ({
  getOpportunityById: vi.fn(),
}));

describe("GET /api/opportunities/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no authenticated user", async () => {
    const { requireUserAPI } = await import("@/lib/auth/api-guard");
    vi.mocked(requireUserAPI).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      ),
    });

    const req = new Request("http://localhost/api/opportunities/opp-1");
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "opp-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 200 with opportunity data", async () => {
    vi.mocked(getOpportunityById).mockResolvedValue({
      id: "opp-1",
      title: "Test Opportunity",
      score: 85,
    } as never);
    const req = new Request("http://localhost/api/opportunities/opp-1");
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "opp-1" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 when opportunity not found", async () => {
    vi.mocked(getOpportunityById).mockRejectedValue(
      new Error("Opportunity not found"),
    );
    const req = new Request("http://localhost/api/opportunities/missing");
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 500 on other errors", async () => {
    vi.mocked(getOpportunityById).mockRejectedValue(new Error("DB down"));
    const req = new Request("http://localhost/api/opportunities/opp-1");
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "opp-1" }),
    });
    expect(res.status).toBe(500);
  });
});