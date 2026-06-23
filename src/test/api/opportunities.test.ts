import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/opportunities/route";
import { findOpportunities } from "@/services/opportunities";

vi.mock("@/services/opportunities", () => ({
  findOpportunities: vi.fn(),
}));

describe("GET /api/opportunities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with opportunities list", async () => {
    const mockOpportunities = [
      {
        id: "1",
        title: "Opportunity 1",
        description: "Description 1",
        score: 85,
        cluster_id: "cluster-1",
      },
      {
        id: "2",
        title: "Opportunity 2",
        description: "Description 2",
        score: 75,
        cluster_id: "cluster-2",
      },
    ];

    vi.mocked(findOpportunities).mockResolvedValue(mockOpportunities as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockOpportunities);
    expect(findOpportunities).toHaveBeenCalled();
  });

  it("should return empty array when no opportunities", async () => {
    vi.mocked(findOpportunities).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("should return 500 on error", async () => {
    vi.mocked(findOpportunities).mockRejectedValue(new Error("DB error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch opportunities");
  });
});
