import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing
vi.mock("@/lib/db/repositories/pain-points.repository", () => ({
  PainPointsRepository: { create: vi.fn() },
}));
vi.mock("@/lib/db/repositories/pain-clusters.repository", () => ({
  PainClustersRepository: { create: vi.fn() },
}));
vi.mock("@/lib/db/repositories/embeddings.repository", () => ({
  EmbeddingsRepository: { create: vi.fn() },
}));
vi.mock("@/lib/ai/base.provider", () => ({
  getAIProviderFromEnv: vi.fn(),
}));
vi.mock("@/lib/clustering/semantic-cluster", () => ({
  clusterPainPointsBySimilarity: vi.fn(),
}));

import { clusterPainPointsFromDatabase } from "@/services/pipeline/clusters.service";
import { PainPointsRepository } from "@/lib/db/repositories/pain-points.repository";
import { PainClustersRepository } from "@/lib/db/repositories/pain-clusters.repository";
import { EmbeddingsRepository } from "@/lib/db/repositories/embeddings.repository";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";
import { clusterPainPointsBySimilarity } from "@/lib/clustering/semantic-cluster";

describe("clusterPainPointsFromDatabase", () => {
  let mockPainPointsRepo: any;
  let mockClustersRepo: any;
  let mockEmbeddingsRepo: any;
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPainPointsRepo = {
      listUnclustered: vi.fn().mockResolvedValue([]),
      markClustered: vi.fn().mockResolvedValue(undefined),
    };
    mockClustersRepo = {
      findByName: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    };
    mockEmbeddingsRepo = {
      findByPainPointId: vi.fn().mockResolvedValue(null),
    };
    mockProvider = {
      clusterPainPoints: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(PainPointsRepository.create).mockResolvedValue(mockPainPointsRepo as any);
    vi.mocked(PainClustersRepository.create).mockResolvedValue(mockClustersRepo as any);
    vi.mocked(EmbeddingsRepository.create).mockResolvedValue(mockEmbeddingsRepo as any);
    vi.mocked(getAIProviderFromEnv).mockReturnValue(mockProvider);
  });

  it("should return zeros when no unclustered pain points", async () => {
    mockPainPointsRepo.listUnclustered.mockResolvedValue([]);

    const result = await clusterPainPointsFromDatabase(100);

    expect(result).toEqual({
      processed: 0,
      clustered: 0,
      inserted: 0,
      averageClusterSize: 0,
      largestClusterSize: 0,
    });
  });

  it("should return zeros when no embeddings found", async () => {
    mockPainPointsRepo.listUnclustered.mockResolvedValue([
      { id: "pp-1", description: "Slow site", clustered: false },
    ]);
    mockEmbeddingsRepo.findByPainPointId.mockResolvedValue(null);

    const result = await clusterPainPointsFromDatabase(100);

    expect(result).toEqual({
      processed: 0,
      clustered: 0,
      inserted: 0,
      averageClusterSize: 0,
      largestClusterSize: 0,
    });
  });

  it("should return zeros when no clusters found", async () => {
    mockPainPointsRepo.listUnclustered.mockResolvedValue([
      { id: "pp-1", description: "Slow site", clustered: false },
    ]);
    mockEmbeddingsRepo.findByPainPointId.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
    });
    vi.mocked(clusterPainPointsBySimilarity).mockReturnValue([]);

    const result = await clusterPainPointsFromDatabase(100);

    expect(result).toEqual({
      processed: 0,
      clustered: 0,
      inserted: 0,
      averageClusterSize: 0,
      largestClusterSize: 0,
    });
  });

  it("should create clusters and mark pain points as clustered", async () => {
    mockPainPointsRepo.listUnclustered.mockResolvedValue([
      { id: "pp-1", description: "Slow site", clustered: false },
      { id: "pp-2", description: "Performance issues", clustered: false },
    ]);
    mockEmbeddingsRepo.findByPainPointId.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
    });

    const mockSemanticClusters = [
      {
        name: "",
        description: "",
        members: [
          { painPointId: "pp-1", description: "Slow site" },
          { painPointId: "pp-2", description: "Performance issues" },
        ],
      },
    ];
    vi.mocked(clusterPainPointsBySimilarity).mockReturnValue(mockSemanticClusters as any);

    mockProvider.clusterPainPoints.mockResolvedValue([
      { cluster_name: "Performance Issues", description: "Website speed problems" },
    ]);

    const result = await clusterPainPointsFromDatabase(100);

    expect(result.inserted).toBe(1);
    expect(result.clustered).toBe(1);
    expect(result.processed).toBe(2);
    expect(result.averageClusterSize).toBe(2);
    expect(result.largestClusterSize).toBe(2);
    expect(mockClustersRepo.create).toHaveBeenCalledWith({
      name: "Performance Issues",
      description: "Website speed problems",
      cluster_size: 2,
    });
    expect(mockPainPointsRepo.markClustered).toHaveBeenCalledTimes(2);
  });
});
