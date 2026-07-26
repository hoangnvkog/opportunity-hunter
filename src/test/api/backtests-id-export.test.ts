import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/backtests/[id]/export/route";
import { getBacktestById } from "@/services/backtesting/backtesting.service";

vi.mock("@/services/backtesting/backtesting.service", () => ({
  getBacktestById: vi.fn(),
}));

describe("GET /api/backtests/[id]/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 JSON when format=json", async () => {
    vi.mocked(getBacktestById).mockResolvedValue({
      id: "bt-1",
      opportunity_id: "opp-1",
      evaluation_date: "2026-01-15",
      predicted_score: 80,
      actual_score: 78,
    } as never);
    const req = new Request(
      "http://localhost/api/backtests/bt-1/export?format=json",
    );
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "bt-1" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid format", async () => {
    const req = new Request(
      "http://localhost/api/backtests/bt-1/export?format=xml",
    );
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "bt-1" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when backtest not found", async () => {
    vi.mocked(getBacktestById).mockResolvedValue(null);
    const req = new Request(
      "http://localhost/api/backtests/bt-1/export?format=json",
    );
    const res = await GET(req as never, {
      params: Promise.resolve({ id: "bt-1" }),
    });
    expect(res.status).toBe(404);
  });
});