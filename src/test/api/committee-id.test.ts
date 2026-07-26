import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/committee/[id]/route";
import { getCommitteeWithVotes } from "@/lib/services/committee.service";
import { runInvestmentCommittee } from "@/services/investment-committee/committee.service";

vi.mock("@/lib/services/committee.service", () => ({
  getCommitteeWithVotes: vi.fn(),
}));

vi.mock("@/services/investment-committee/committee.service", () => ({
  runInvestmentCommittee: vi.fn(),
}));

describe("GET /api/committee/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns committee data when found", async () => {
    vi.mocked(getCommitteeWithVotes).mockResolvedValue({
      committee: { id: "abc" },
      votes: [],
    } as never);
    const req = new Request("http://localhost/api/committee/abc");
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 when not found", async () => {
    vi.mocked(getCommitteeWithVotes).mockResolvedValue(null);
    const req = new Request("http://localhost/api/committee/abc");
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 500 on service error", async () => {
    vi.mocked(getCommitteeWithVotes).mockRejectedValue(new Error("DB"));
    const req = new Request("http://localhost/api/committee/abc");
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(500);
  });
});

describe("POST /api/committee/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs investment committee for opportunity", async () => {
    vi.mocked(runInvestmentCommittee).mockResolvedValue({
      decision: "BUY",
      score: 85,
    } as never);
    const req = new Request("http://localhost/api/committee/abc", {
      method: "POST",
    });
    const res = await POST(req as never, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(201);
  });
});