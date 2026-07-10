import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/filter/route";
import {
  getFilteredOpportunities,
  getFilteredStartupIdeas,
} from "@/services/dashboard/dashboard.service";

vi.mock("@/services/dashboard/dashboard.service", () => ({
  getFilteredOpportunities: vi.fn(),
  getFilteredStartupIdeas: vi.fn(),
}));

function makeRequest(qs: string): Request {
  return new Request(`http://localhost/api/filter${qs}`);
}

describe("GET /api/filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses and forwards numeric filters", async () => {
    vi.mocked(getFilteredOpportunities).mockResolvedValue([]);
    vi.mocked(getFilteredStartupIdeas).mockResolvedValue([]);

    const response = await GET(
      makeRequest(
        "?minScore=70&minFrequency=3&minSeverity=0.5&minBuyingIntent=0.4&limit=20&search=ai",
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ opportunities: [], ideas: [] });

    expect(getFilteredOpportunities).toHaveBeenCalledWith({
      minScore: 70,
      minFrequency: 3,
      minSeverity: 0.5,
      minBuyingIntent: 0.4,
      search: "ai",
      limit: 20,
    });

    expect(getFilteredStartupIdeas).toHaveBeenCalledWith({
      search: "ai",
      limit: 20,
    });
  });

  it("treats missing or invalid numbers as undefined", async () => {
    vi.mocked(getFilteredOpportunities).mockResolvedValue([]);
    vi.mocked(getFilteredStartupIdeas).mockResolvedValue([]);

    await GET(makeRequest("?minScore=notanumber"));

    expect(getFilteredOpportunities).toHaveBeenLastCalledWith({
      minScore: undefined,
      minFrequency: undefined,
      minSeverity: undefined,
      minBuyingIntent: undefined,
      search: undefined,
      limit: 10,
    });
  });

  it("clamps limit to [1, 100]", async () => {
    vi.mocked(getFilteredOpportunities).mockResolvedValue([]);
    vi.mocked(getFilteredStartupIdeas).mockResolvedValue([]);

    await GET(makeRequest("?limit=5000"));
    expect(getFilteredOpportunities).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 100 }),
    );

    await GET(makeRequest("?limit=-7"));
    expect(getFilteredOpportunities).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 1 }),
    );
  });

  it("returns 500 on service error", async () => {
    vi.mocked(getFilteredOpportunities).mockRejectedValue(new Error("boom"));

    const response = await GET(makeRequest("?minScore=50"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to apply filters");
  });
});
