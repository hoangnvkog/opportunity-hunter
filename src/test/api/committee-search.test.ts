import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "@/app/api/committee/search/route";
import { listCommittees } from "@/lib/services/committee.service";

vi.mock("@/lib/services/committee.service", () => ({
  listCommittees: vi.fn(),
}));

describe("GET /api/committee/search", () => {
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

    const req = new Request("http://localhost/api/committee/search");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with committees list", async () => {
    vi.mocked(listCommittees).mockResolvedValue({
      rows: [],
      total: 0,
    } as never);
    const req = new Request(
      "http://localhost/api/committee/search?finalDecision=BUY&limit=10",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("returns 500 on service error", async () => {
    vi.mocked(listCommittees).mockRejectedValue(new Error("DB"));
    const req = new Request("http://localhost/api/committee/search");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});