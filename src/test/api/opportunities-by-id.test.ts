import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/opportunities/[id]/route";
import { getOpportunityById } from "@/services/opportunities";

vi.mock("@/services/opportunities", () => ({
  getOpportunityById: vi.fn(),
}));

describe("GET /api/opportunities/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with opportunity data", async () => {
    const mockOpportunity = {
      id: "opp-1",
      title: "Test Opportunity",
      description: "Test description",
      score: 85,
      cluster_id: "cluster-1",
      frequency: 10,
      severity: 0.8,
      buying_intent: 0.7,
    };

    vi.mocked(getOpportunityById).mockResolvedValue(mockOpportunity as any);

    const request = new Request("http://localhost:3000/api/opportunities/opp-1");
    const response = await GET(request, { params: Promise.resolve({ id: "opp-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockOpportunity);
    expect(getOpportunityById).toHaveBeenCalledWith("opp-1");
  });

  it("should return 404 when opportunity not found", async () => {
    vi.mocked(getOpportunityById).mockRejectedValue(new Error("Opportunity not found"));

    const request = new Request("http://localhost:3000/api/opportunities/non-existent");
    const response = await GET(request, { params: Promise.resolve({ id: "non-existent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Opportunity not found");
  });

  it("should return 500 on other errors", async () => {
    vi.mocked(getOpportunityById).mockRejectedValue(new Error("DB error"));

    const request = new Request("http://localhost:3000/api/opportunities/opp-1");
    const response = await GET(request, { params: Promise.resolve({ id: "opp-1" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch opportunity");
  });
});
