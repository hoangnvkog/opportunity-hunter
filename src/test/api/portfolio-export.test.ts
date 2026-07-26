import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/portfolio/export/route";
import { listPortfolioCards } from "@/lib/services/portfolio.service";

vi.mock("@/lib/services/portfolio.service", () => ({
  listPortfolioCards: vi.fn(),
}));

describe("GET /api/portfolio/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 CSV when format=csv", async () => {
    vi.mocked(listPortfolioCards).mockResolvedValue([] as never);
    const req = new NextRequest(
      new Request("http://localhost/api/portfolio/export?format=csv"),
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("returns 200 JSON when format=json", async () => {
    vi.mocked(listPortfolioCards).mockResolvedValue([
      { id: "1", name: "Test" },
    ] as never);
    const req = new NextRequest(
      new Request("http://localhost/api/portfolio/export?format=json"),
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});