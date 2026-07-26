import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/committee/[id]/export/route";
import { getCommitteeWithVotes } from "@/lib/services/committee.service";

vi.mock("@/lib/services/committee.service", () => ({
  getCommitteeWithVotes: vi.fn(),
}));

describe("GET /api/committee/[id]/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 markdown by default", async () => {
    vi.mocked(getCommitteeWithVotes).mockResolvedValue({
      committee: { id: "abc", finalDecision: "BUY" },
      votes: [],
    } as never);
    const req = new Request("http://localhost/api/committee/abc/export");
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 200 JSON when format=json", async () => {
    vi.mocked(getCommitteeWithVotes).mockResolvedValue({
      committee: { id: "abc", finalDecision: "BUY" },
      votes: [],
    } as never);
    const req = new Request(
      "http://localhost/api/committee/abc/export?format=json",
    );
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 404 when committee not found", async () => {
    vi.mocked(getCommitteeWithVotes).mockResolvedValue(null);
    const req = new Request("http://localhost/api/committee/abc/export");
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(404);
  });
});