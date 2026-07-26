import { describe, it, expect, vi, beforeEach } from "vitest";


import { NextResponse } from "next/server";
import { GET } from "@/app/api/dashboard/route";
import {
  getDashboardMetrics,
  getRecentOpportunities,
  getCategoryTrends,
} from "@/services/dashboard";

vi.mock("@/services/dashboard", () => ({
  getDashboardMetrics: vi.fn(),
  getRecentOpportunities: vi.fn(),
  getCategoryTrends: vi.fn(),
}));

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no authenticated user", async () => {
    // setup.ts provides a default mock that returns ok:true. We override
    // here to exercise the unauthorized branch.
    const { requireUserAPI } = await import("@/lib/auth/api-guard");
    vi.mocked(requireUserAPI).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      ),
    });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("should return 200 with dashboard data", async () => {
    const mockMetrics = {
      totalOpportunities: 42,
      totalClusters: 15,
      totalPainPoints: 120,
      avgScore: 78.5,
    };

    const mockRecentOpportunities = [
      {
        id: "1",
        title: "Recent Opp 1",
        score: 90,
        created_at: "2026-06-23T10:00:00Z",
      },
    ];

    const mockCategoryTrends = [
      { category: "Technical", count: 25 },
      { category: "Business", count: 18 },
    ];

    vi.mocked(getDashboardMetrics).mockResolvedValue(mockMetrics as any);
    vi.mocked(getRecentOpportunities).mockResolvedValue(mockRecentOpportunities as any);
    vi.mocked(getCategoryTrends).mockResolvedValue(mockCategoryTrends as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      metrics: mockMetrics,
      recentOpportunities: mockRecentOpportunities,
      categoryTrends: mockCategoryTrends,
    });

    expect(getDashboardMetrics).toHaveBeenCalled();
    expect(getRecentOpportunities).toHaveBeenCalled();
    expect(getCategoryTrends).toHaveBeenCalled();
  });

  it("should return 500 on error", async () => {
    vi.mocked(getDashboardMetrics).mockRejectedValue(new Error("DB error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch dashboard data");
  });
});
