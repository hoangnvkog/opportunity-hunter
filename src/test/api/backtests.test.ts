import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/backtests/route";
import {
  listBacktests,
  evaluateOpportunity,
  evaluateBatch,
} from "@/services/backtesting/backtesting.service";

vi.mock("@/services/backtesting/backtesting.service", () => ({
  listBacktests: vi.fn(),
  getStatistics: vi.fn(),
  evaluateOpportunity: vi.fn(),
  evaluateBatch: vi.fn(),
}));

describe("GET /api/backtests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with backtests list", async () => {
    vi.mocked(listBacktests).mockResolvedValue({
      rows: [],
      total: 0,
    } as never);
    const req = new Request("http://localhost/api/backtests?limit=10");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("returns 500 on service error", async () => {
    vi.mocked(listBacktests).mockRejectedValue(new Error("DB"));
    const req = new Request("http://localhost/api/backtests");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe("POST /api/backtests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("evaluates single opportunity when id is provided", async () => {
    vi.mocked(evaluateOpportunity).mockResolvedValue({
      processed: 1,
      inserted: 1,
      skipped: 0,
    });
    const req = new Request("http://localhost/api/backtests", {
      method: "POST",
      body: JSON.stringify({ opportunityId: "abc-123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("runs batch evaluation when action=evaluate-batch", async () => {
    vi.mocked(evaluateBatch).mockResolvedValue({
      processed: 5,
      evaluated: 3,
      skipped: 2,
      inserted: 3,
      updated: 0,
    });
    const req = new Request("http://localhost/api/backtests", {
      method: "POST",
      body: JSON.stringify({ action: "evaluate-batch" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 when neither opportunityId nor action is provided", async () => {
    const req = new Request("http://localhost/api/backtests", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});