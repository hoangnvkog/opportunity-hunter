import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/investment-memos/search/route";
import { searchMemos, searchMemosCount } from "@/services/investment-memo/investment-memo.service";

vi.mock("@/services/investment-memo/investment-memo.service", () => ({
  searchMemos: vi.fn(),
  searchMemosCount: vi.fn(),
}));

describe("GET /api/investment-memos/search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with search results", async () => {
    vi.mocked(searchMemos).mockResolvedValue([] as never);
    vi.mocked(searchMemosCount).mockResolvedValue(0);
    const req = new Request(
      "http://localhost/api/investment-memos/search?query=ai",
    );
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.results).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("returns 500 on service error", async () => {
    vi.mocked(searchMemos).mockRejectedValue(new Error("DB"));
    const req = new Request("http://localhost/api/investment-memos/search");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});