import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies before importing
vi.mock("@/services/sources/ingestion.service", () => ({
  fetchAllSources: vi.fn(),
}));
vi.mock("@/lib/db/repositories", () => ({
  RawPostsRepository: { create: vi.fn() },
  OpportunityEvidenceRepository: { create: vi.fn() },
  OpportunityValidationsRepository: { create: vi.fn() },
  OpportunitiesRepository: { create: vi.fn(), list: vi.fn(), findByIds: vi.fn() },
  PainPointsRepository: { create: vi.fn() },
  PainClustersRepository: { create: vi.fn() },
  StartupIdeasRepository: { create: vi.fn() },
  OpportunityForecastsRepository: { create: vi.fn() },
}));
vi.mock("@/services/pipeline/pain-points.service", () => ({
  extractPainPointsFromPosts: vi.fn(),
}));
vi.mock("@/services/pipeline/embeddings.service", () => ({
  generateEmbeddingsFromDatabase: vi.fn(),
}));
vi.mock("@/services/pipeline/clusters.service", () => ({
  clusterPainPointsFromDatabase: vi.fn(),
}));
vi.mock("@/services/pipeline/opportunities.service", () => ({
  generateOpportunitiesFromDatabase: vi.fn(),
}));
vi.mock("@/services/pipeline/startup-ideas.service", () => ({
  generateStartupIdeasFromDatabase: vi.fn(),
}));
vi.mock("@/services/validation/validation.service", () => ({
  validateOpportunitiesFromDatabase: vi.fn(),
}));
vi.mock("@/services/evidence/evidence.service", () => ({
  generateEvidenceBatch: vi.fn(),
}));
vi.mock("@/services/forecasts/forecast.service", () => ({
  generateForecastBatch: vi.fn(),
}));
vi.mock("@/services/forecasts/forecast-alerts.service", () => ({
  processForecastAlerts: vi.fn().mockResolvedValue({
    processed: 0,
    alertsCreated: 0,
    emailsQueued: 0,
    triggered: 0,
    skipped: 0,
    threshold: 90,
  }),
}));

import { runPipeline } from "@/services/pipeline/runner.service";
import { fetchAllSources } from "@/services/sources/ingestion.service";
import { RawPostsRepository } from "@/lib/db/repositories";
import { extractPainPointsFromPosts } from "@/services/pipeline/pain-points.service";
import { generateEmbeddingsFromDatabase } from "@/services/pipeline/embeddings.service";
import { clusterPainPointsFromDatabase } from "@/services/pipeline/clusters.service";
import { generateOpportunitiesFromDatabase } from "@/services/pipeline/opportunities.service";
import { generateStartupIdeasFromDatabase } from "@/services/pipeline/startup-ideas.service";
import { validateOpportunitiesFromDatabase } from "@/services/validation/validation.service";
import { generateEvidenceBatch } from "@/services/evidence/evidence.service";
import { generateForecastBatch } from "@/services/forecasts/forecast.service";

// Helper to create correct-shaped mock returns
const oppResult = (processed: number, generated: number, inserted: number) => ({
  processed,
  generated,
  inserted,
  scoreStats: { average_score: 85, highest_score: 90, lowest_score: 80 },
});

const ideasResult = (processed: number, generated: number, skipped: number, inserted: number) => ({
  processed,
  generated,
  skipped,
  inserted,
});

describe("runPipeline (E2E)", () => {
  let mockRawPostsRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRawPostsRepo = {
      list: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue([
        { id: "rp-1", url: "u1" },
        { id: "rp-2", url: "u2" },
      ]),
    };

    vi.mocked(RawPostsRepository.create).mockResolvedValue(mockRawPostsRepo as any);
  });

  it("should run full pipeline successfully", async () => {
    const mockPosts = [
      { source: "reddit", title: "T1", content: "C1", url: "u1", score: 100, created_at: "2026-06-23" },
      { source: "reddit", title: "T2", content: "C2", url: "u2", score: 80, created_at: "2026-06-23" },
    ];

    vi.mocked(fetchAllSources).mockResolvedValue(mockPosts as any);
    vi.mocked(extractPainPointsFromPosts).mockResolvedValue({ processed: 2, extracted: 5, inserted: 5 });
    vi.mocked(generateEmbeddingsFromDatabase).mockResolvedValue({ processed: 5, skipped: 0, inserted: 5 });
    vi.mocked(clusterPainPointsFromDatabase).mockResolvedValue({
      processed: 5,
      clustered: 2,
      inserted: 2,
      averageClusterSize: 2.5,
      largestClusterSize: 3,
    });
    vi.mocked(generateOpportunitiesFromDatabase).mockResolvedValue(oppResult(2, 2, 2));
    vi.mocked(generateStartupIdeasFromDatabase).mockResolvedValue(ideasResult(2, 2, 0, 2));
    vi.mocked(validateOpportunitiesFromDatabase).mockResolvedValue({ processed: 2, validated: 2, inserted: 2, skipped: 0 });
    vi.mocked(generateEvidenceBatch).mockResolvedValue({ processed: 2, generated: 10, skipped: 0, inserted: 10 });
    vi.mocked(generateForecastBatch).mockResolvedValue({ processed: 2, generated: 2, skipped: 0, inserted: 2 });

    const result = await runPipeline();

    expect(result.sources).toBe(1); // reddit only
    expect(result.rawPosts).toBe(2);
    expect(result.painPoints).toBe(5);
    expect(result.embeddings).toBe(5);
    expect(result.clusters).toBe(2);
    expect(result.opportunities).toBe(2);
    expect(result.ideas).toBe(2);
    expect(result.averageClusterSize).toBe(2.5);
    expect(result.largestClusterSize).toBe(3);
    expect(result.forecasts).toBe(2);

    // Verify all stages were called
    expect(fetchAllSources).toHaveBeenCalledWith(25);
    expect(extractPainPointsFromPosts).toHaveBeenCalledWith(50);
    expect(generateEmbeddingsFromDatabase).toHaveBeenCalledWith(1000);
    expect(clusterPainPointsFromDatabase).toHaveBeenCalledWith(100);
    expect(generateOpportunitiesFromDatabase).toHaveBeenCalledWith(50);
    expect(generateStartupIdeasFromDatabase).toHaveBeenCalledWith(50);
  });

  it("should throw error when no posts fetched", async () => {
    vi.mocked(fetchAllSources).mockResolvedValue([]);

    await expect(runPipeline()).rejects.toThrow("No posts fetched from any source");
  });

  it("should deduplicate posts by URL", async () => {
    const mockPosts = [
      { source: "reddit", title: "T1", content: "C1", url: "existing-url", score: 100, created_at: "2026-06-23" },
      { source: "reddit", title: "T2", content: "C2", url: "new-url", score: 80, created_at: "2026-06-23" },
    ];

    // One existing URL in DB
    mockRawPostsRepo.list.mockResolvedValue([
      { url: "existing-url" },
    ]);
    mockRawPostsRepo.createMany.mockResolvedValue([{ id: "rp-2", url: "new-url" }]);

    vi.mocked(fetchAllSources).mockResolvedValue(mockPosts as any);
    vi.mocked(extractPainPointsFromPosts).mockResolvedValue({ processed: 0, extracted: 0, inserted: 0 });
    vi.mocked(generateEmbeddingsFromDatabase).mockResolvedValue({ processed: 0, skipped: 0, inserted: 0 });
    vi.mocked(clusterPainPointsFromDatabase).mockResolvedValue({
      processed: 0, clustered: 0, inserted: 0, averageClusterSize: 0, largestClusterSize: 0,
    });
    vi.mocked(generateOpportunitiesFromDatabase).mockResolvedValue(oppResult(0, 0, 0));
    vi.mocked(generateStartupIdeasFromDatabase).mockResolvedValue(ideasResult(0, 0, 0, 0));
    vi.mocked(validateOpportunitiesFromDatabase).mockResolvedValue({ processed: 0, validated: 0, inserted: 0, skipped: 0 });

    const result = await runPipeline();

    // Only the new URL should be inserted
    expect(mockRawPostsRepo.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ url: "new-url" }),
    ]);
    expect(result.rawPosts).toBe(1);
  });

  it("should continue pipeline even when embeddings fail", async () => {
    const mockPosts = [
      { source: "reddit", title: "T1", content: "C1", url: "u1", score: 100, created_at: "2026-06-23" },
    ];

    vi.mocked(fetchAllSources).mockResolvedValue(mockPosts as any);
    vi.mocked(extractPainPointsFromPosts).mockResolvedValue({ processed: 1, extracted: 3, inserted: 3 });
    vi.mocked(generateEmbeddingsFromDatabase).mockRejectedValue(new Error("Embedding API down"));
    vi.mocked(clusterPainPointsFromDatabase).mockResolvedValue({
      processed: 3, clustered: 1, inserted: 1, averageClusterSize: 3, largestClusterSize: 3,
    });
    vi.mocked(generateOpportunitiesFromDatabase).mockResolvedValue(oppResult(1, 1, 1));
    vi.mocked(generateStartupIdeasFromDatabase).mockResolvedValue(ideasResult(1, 1, 0, 1));
    vi.mocked(validateOpportunitiesFromDatabase).mockResolvedValue({ processed: 1, validated: 1, inserted: 1, skipped: 0 });
    vi.mocked(generateEvidenceBatch).mockResolvedValue({ processed: 1, generated: 5, skipped: 0, inserted: 5 });

    const result = await runPipeline();

    // Pipeline should complete despite embeddings failure
    expect(result.embeddings).toBe(0);
    expect(result.clusters).toBe(1);
    expect(result.opportunities).toBe(1);
    expect(result.ideas).toBe(1);
  });

  it("should count multiple sources correctly", async () => {
    const mockPosts = [
      { source: "reddit", title: "T1", content: "C1", url: "u1", score: 100, created_at: "2026-06-23" },
      { source: "hackernews", title: "T2", content: "C2", url: "u2", score: 80, created_at: "2026-06-23" },
      { source: "reddit", title: "T3", content: "C3", url: "u3", score: 60, created_at: "2026-06-23" },
    ];

    vi.mocked(fetchAllSources).mockResolvedValue(mockPosts as any);
    vi.mocked(extractPainPointsFromPosts).mockResolvedValue({ processed: 0, extracted: 0, inserted: 0 });
    vi.mocked(generateEmbeddingsFromDatabase).mockResolvedValue({ processed: 0, skipped: 0, inserted: 0 });
    vi.mocked(clusterPainPointsFromDatabase).mockResolvedValue({
      processed: 0, clustered: 0, inserted: 0, averageClusterSize: 0, largestClusterSize: 0,
    });
    vi.mocked(generateOpportunitiesFromDatabase).mockResolvedValue(oppResult(0, 0, 0));
    vi.mocked(generateStartupIdeasFromDatabase).mockResolvedValue(ideasResult(0, 0, 0, 0));
    vi.mocked(validateOpportunitiesFromDatabase).mockResolvedValue({ processed: 0, validated: 0, inserted: 0, skipped: 0 });
    vi.mocked(generateEvidenceBatch).mockResolvedValue({ processed: 0, generated: 0, skipped: 0, inserted: 0 });

    const result = await runPipeline();

    expect(result.sources).toBe(2); // reddit + hackernews
  });
});
