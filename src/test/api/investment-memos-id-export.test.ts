import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/investment-memos/[id]/export/route";
import { getMemoById, trackMemoExported } from "@/services/investment-memo/investment-memo.service";

vi.mock("@/services/investment-memo/investment-memo.service", () => ({
  getMemoById: vi.fn(),
  trackMemoExported: vi.fn(),
}));

describe("GET /api/investment-memos/[id]/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 markdown when format=markdown", async () => {
    vi.mocked(getMemoById).mockResolvedValue({
      id: "memo-1",
      title: "Test Memo",
      content: "# Content",
      opportunity_id: "opp-1",
      created_at: "2026-01-15T00:00:00Z",
      recommendation: "BUY",
      confidence: 85,
    } as never);
    vi.mocked(trackMemoExported).mockResolvedValue(undefined);
    const req = new Request(
      "http://localhost/api/investment-memos/memo-1/export?format=markdown",
    );
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "memo-1" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid format", async () => {
    const req = new Request(
      "http://localhost/api/investment-memos/memo-1/export?format=exe",
    );
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "memo-1" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when memo not found", async () => {
    vi.mocked(getMemoById).mockResolvedValue(null);
    const req = new Request(
      "http://localhost/api/investment-memos/memo-1/export?format=json",
    );
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "memo-1" }),
    });
    expect(res.status).toBe(404);
  });
});