import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/search/route";
import {
  getFilteredOpportunities,
  getFilteredStartupIdeas,
} from "@/services/dashboard/dashboard.service";

vi.mock("@/services/dashboard/dashboard.service", () => ({
  getFilteredOpportunities: vi.fn(),
  getFilteredStartupIdeas: vi.fn(),
}));

function makeRequest(qs: string): Request {
  return new Request(`http://localhost/api/search${qs}`);
}

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with opportunities + ideas when q is provided", async () => {
    const mockOpps = [{ id: "o1", title: "Match" }];
    const mockIdeas = [{ id: "i1", title: "Idea" }];
    vi.mocked(getFilteredOpportunities).mockResolvedValue(mockOpps as any);
    vi.mocked(getFilteredStartupIdeas).mockResolvedValue(mockIdeas as any);

    const response = await GET(makeRequest("?q=crm&limit=5"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ opportunities: mockOpps, ideas: mockIdeas });
    expect(getFilteredOpportunities).toHaveBeenCalledWith({
      search: "crm",
      limit: 5,
    });
    expect(getFilteredStartupIdeas).toHaveBeenCalledWith({
      search: "crm",
      limit: 5,
    });
  });

  it("treats blank q as 'no search' and uses default limit of 10", async () => {
    vi.mocked(getFilteredOpportunities).mockResolvedValue([]);
    vi.mocked(getFilteredStartupIdeas).mockResolvedValue([]);

    const response = await GET(makeRequest("?q="));
    expect(response.status).toBe(200);

    expect(getFilteredOpportunities).toHaveBeenCalledWith({
      search: undefined,
      limit: 10,
    });
  });

  it("clamps limit to [1, 100]", async () => {
    vi.mocked(getFilteredOpportunities).mockResolvedValue([]);
    vi.mocked(getFilteredStartupIdeas).mockResolvedValue([]);

    await GET(makeRequest("?limit=9999"));
    expect(getFilteredOpportunities).toHaveBeenLastCalledWith({
      search: undefined,
      limit: 100,
    });

    await GET(makeRequest("?limit=0"));
    expect(getFilteredOpportunities).toHaveBeenLastCalledWith({
      search: undefined,
      limit: 1,
    });
  });

  it("returns 500 when the service throws", async () => {
    vi.mocked(getFilteredOpportunities).mockRejectedValue(new Error("DB boom"));

    const response = await GET(makeRequest("?q=anything"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to perform search");
  });
});
