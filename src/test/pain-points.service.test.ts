import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing
vi.mock("@/lib/db/repositories/raw-posts.repository", () => ({
  RawPostsRepository: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/db/repositories/pain-points.repository", () => ({
  PainPointsRepository: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/ai/base.provider", () => ({
  getAIProviderFromEnv: vi.fn(),
}));

import { extractPainPointsFromPosts } from "@/services/pipeline/pain-points.service";
import { RawPostsRepository } from "@/lib/db/repositories/raw-posts.repository";
import { PainPointsRepository } from "@/lib/db/repositories/pain-points.repository";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";

describe("extractPainPointsFromPosts", () => {
  let mockRawPostsRepo: any;
  let mockPainPointsRepo: any;
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRawPostsRepo = {
      listUnprocessed: vi.fn().mockResolvedValue([]),
      markProcessed: vi.fn().mockResolvedValue(undefined),
    };

    mockPainPointsRepo = {
      create: vi.fn().mockResolvedValue({}),
    };

    mockProvider = {
      extractPainPoints: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(RawPostsRepository.create).mockResolvedValue(mockRawPostsRepo as any);
    vi.mocked(PainPointsRepository.create).mockResolvedValue(mockPainPointsRepo as any);
    vi.mocked(getAIProviderFromEnv).mockReturnValue(mockProvider);
  });

  it("should return zeros when no unprocessed posts", async () => {
    mockRawPostsRepo.listUnprocessed.mockResolvedValue([]);

    const result = await extractPainPointsFromPosts(50);

    expect(result).toEqual({ processed: 0, extracted: 0, inserted: 0 });
    expect(mockProvider.extractPainPoints).not.toHaveBeenCalled();
  });

  it("should extract pain points from unprocessed posts", async () => {
    const mockPosts = [
      {
        id: "post-1",
        source: "reddit",
        title: "I hate slow websites",
        content: "Performance issues are killing my productivity",
        url: "https://reddit.com/r/webdev/1",
        score: 100,
        created_at: "2026-06-23T10:00:00Z",
      },
    ];

    const mockPainPoints = [
      { pain: "Slow website performance", category: "technical", severity: 0.8, buying_intent: 0.7 },
    ];

    mockRawPostsRepo.listUnprocessed.mockResolvedValue(mockPosts);
    mockProvider.extractPainPoints.mockResolvedValue(mockPainPoints);
    mockPainPointsRepo.create.mockResolvedValue({ id: "pp-1" });

    const result = await extractPainPointsFromPosts(50);

    expect(result.processed).toBe(1);
    expect(result.extracted).toBe(1);
    expect(result.inserted).toBe(1);
    expect(mockRawPostsRepo.markProcessed).toHaveBeenCalledWith("post-1");
    expect(mockPainPointsRepo.create).toHaveBeenCalledWith({
      raw_post_id: "post-1",
      description: "Slow website performance",
      category: "technical",
      severity: 80,
      buying_intent: "0.700",
    });
  });

  it("should continue processing on individual post failure", async () => {
    const mockPosts = [
      { id: "post-1", source: "reddit", title: "Bad post", content: "", url: "u1", score: 10, created_at: "2026-01-01" },
      { id: "post-2", source: "reddit", title: "Good post", content: "content", url: "u2", score: 20, created_at: "2026-01-01" },
    ];

    mockRawPostsRepo.listUnprocessed.mockResolvedValue(mockPosts);
    mockProvider.extractPainPoints
      .mockRejectedValueOnce(new Error("AI failed"))
      .mockResolvedValueOnce([{ pain: "Some issue", category: "technical", severity: 0.5, buying_intent: 0.3 }]);
    mockPainPointsRepo.create.mockResolvedValue({});

    const result = await extractPainPointsFromPosts(50);

    expect(result.processed).toBe(1); // only post-2 succeeded
    expect(result.extracted).toBe(1);
    expect(result.inserted).toBe(1);
  });

  it("should handle multiple pain points per post", async () => {
    const mockPosts = [
      { id: "post-1", source: "reddit", title: "Multi-issue", content: "Many problems", url: "u1", score: 50, created_at: "2026-01-01" },
    ];

    const mockPainPoints = [
      { pain: "Issue 1", category: "technical", severity: 0.7, buying_intent: 0.5 },
      { pain: "Issue 2", category: "usability", severity: 0.6, buying_intent: 0.4 },
      { pain: "Issue 3", category: "cost", severity: 0.9, buying_intent: 0.8 },
    ];

    mockRawPostsRepo.listUnprocessed.mockResolvedValue(mockPosts);
    mockProvider.extractPainPoints.mockResolvedValue(mockPainPoints);
    mockPainPointsRepo.create.mockResolvedValue({});

    const result = await extractPainPointsFromPosts(50);

    expect(result.processed).toBe(1);
    expect(result.extracted).toBe(3);
    expect(result.inserted).toBe(3);
    expect(mockPainPointsRepo.create).toHaveBeenCalledTimes(3);
  });
});
