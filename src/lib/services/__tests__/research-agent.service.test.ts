/**
 * Sprint 71 H4: Test coverage for research-agent.service.ts
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// ===== HOISTED MOCKS (vi.hoisted is hoisted alongside vi.mock) =====

const {
  mockJobsRepo,
  mockSourcesRepo,
  mockLogsRepo,
  mockRawPostsRepo,
} = vi.hoisted(() => ({
  mockJobsRepo: {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    count: vi.fn(),
  },
  mockSourcesRepo: {
    findByName: vi.fn(),
    update: vi.fn(),
  },
  mockLogsRepo: {
    create: vi.fn(),
    findByJobId: vi.fn(),
  },
  mockRawPostsRepo: {
    createMany: vi.fn(),
  },
}));

// ===== MOCK MODULES (hoisted above imports) =====

vi.mock("@/lib/db/repositories/research-job.repository", () => ({
  ResearchJobsRepository: class MockJobsRepo {
    create = mockJobsRepo.create;
    update = mockJobsRepo.update;
    findById = mockJobsRepo.findById;
    list = mockJobsRepo.list;
    count = mockJobsRepo.count;
  },
}));

vi.mock("@/lib/db/repositories/research-sources.repository", () => ({
  ResearchSourcesRepository: class MockSourcesRepo {
    findByName = mockSourcesRepo.findByName;
    update = mockSourcesRepo.update;
  },
}));

vi.mock("@/lib/db/repositories/research-logs.repository", () => ({
  ResearchLogsRepository: class MockLogsRepo {
    create = mockLogsRepo.create;
    findByJobId = mockLogsRepo.findByJobId;
  },
}));

vi.mock("@/lib/db/repositories/raw-posts.repository", () => ({
  RawPostsRepository: Object.assign(
    class MockRawPostsRepo {
      createMany = mockRawPostsRepo.createMany;
    },
    { create: vi.fn().mockResolvedValue(mockRawPostsRepo) }
  ),
}));

// Mock adapters (class constructors — service does `new RedditAdapter()`)
vi.mock("@/lib/research/adapters/reddit.adapter", () => ({
  RedditAdapter: class {
    health = vi.fn().mockResolvedValue(true);
    collect = vi.fn().mockResolvedValue([
      { id: "reddit_1", source: "reddit", content: "Test post 1", url: "https://reddit.com/1" },
      { id: "reddit_2", source: "reddit", content: "Test post 2", url: "https://reddit.com/2" },
    ]);
  },
}));

vi.mock("@/lib/research/adapters/github.adapter", () => ({
  GithubAdapter: class {
    health = vi.fn().mockResolvedValue(true);
    collect = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock("@/lib/research/adapters/hackernews.adapter", () => ({
  HackerNewsAdapter: class {
    health = vi.fn().mockResolvedValue(true);
    collect = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock("@/lib/research/adapters/producthunt.adapter", () => ({
  ProductHuntAdapter: class {
    health = vi.fn().mockResolvedValue(true);
    collect = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock("@/lib/research/adapters/rss.adapter", () => ({
  RssAdapter: class {
    health = vi.fn().mockResolvedValue(true);
    collect = vi.fn().mockResolvedValue([]);
  },
}));

// Import service AFTER all mocks
import * as ResearchService from "@/lib/services/research-agent.service";
import type { ResearchJobRow } from "@/types/research-job";

// ===== TESTS =====

describe("ResearchAgentService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("startResearch", () => {
    it("should start a research job successfully", async () => {
      const mockJob: ResearchJobRow = {
        id: "job_123", source: "reddit", status: "pending",
        items_found: 0, items_processed: 0,
        created_at: "2026-08-06T15:00:00Z", started_at: null, finished_at: null,
      };

      mockJobsRepo.create.mockResolvedValue(mockJob);
      mockJobsRepo.update.mockResolvedValue({ ...mockJob, status: "running" });
      mockLogsRepo.create.mockResolvedValue({});

      const result = await ResearchService.startResearch("reddit");

      expect(result).toEqual({ ...mockJob, status: "running" });
      expect(mockJobsRepo.create).toHaveBeenCalledWith({
        source: "reddit", status: "pending", items_found: 0, items_processed: 0,
      });
      expect(mockJobsRepo.update).toHaveBeenCalledWith("job_123", expect.objectContaining({ status: "running" }));
      expect(mockLogsRepo.create).toHaveBeenCalledTimes(2);
    });

    it("should throw error for invalid source", async () => {
      await expect(
        // @ts-expect-error Testing invalid source
        ResearchService.startResearch("invalid_source")
      ).rejects.toThrow("Invalid source: invalid_source");
      expect(mockJobsRepo.create).not.toHaveBeenCalled();
    });

    it("should handle job creation failure", async () => {
      mockJobsRepo.create.mockRejectedValue(new Error("Database connection failed"));
      await expect(ResearchService.startResearch("reddit")).rejects.toThrow("Database connection failed");
    });
  });

  describe("getJobStatus", () => {
    it("should return job status", async () => {
      const mockJob: ResearchJobRow = {
        id: "job_123", source: "reddit", status: "completed",
        items_found: 10, items_processed: 10,
        created_at: "2026-08-06T15:00:00Z", started_at: "2026-08-06T15:01:00Z", finished_at: "2026-08-06T15:05:00Z",
      };
      mockJobsRepo.findById.mockResolvedValue(mockJob);

      const result = await ResearchService.getJobStatus("job_123");

      expect(result).toEqual(mockJob);
      expect(mockJobsRepo.findById).toHaveBeenCalledWith("job_123");
    });

    it("should return null for non-existent job", async () => {
      mockJobsRepo.findById.mockResolvedValue(null);
      const result = await ResearchService.getJobStatus("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("listResearchJobs", () => {
    it("should list jobs with filters", async () => {
      const mockJobs: ResearchJobRow[] = [
        { id: "job_1", source: "reddit", status: "completed", items_found: 5, items_processed: 5,
          created_at: "2026-08-06T15:00:00Z", started_at: "2026-08-06T15:01:00Z", finished_at: "2026-08-06T15:05:00Z" },
      ];
      mockJobsRepo.list.mockResolvedValue(mockJobs);

      const result = await ResearchService.listResearchJobs({ status: "completed", limit: 10 });

      expect(result).toEqual(mockJobs);
      expect(mockJobsRepo.list).toHaveBeenCalledWith({ status: "completed", limit: 10 });
    });

    it("should list all jobs when no filters provided", async () => {
      mockJobsRepo.list.mockResolvedValue([]);
      const result = await ResearchService.listResearchJobs();
      expect(result).toEqual([]);
    });
  });

  describe("cancelJob", () => {
    it("should cancel a running job", async () => {
      const mockJob: ResearchJobRow = {
        id: "job_123", source: "reddit", status: "running",
        items_found: 0, items_processed: 0,
        created_at: "2026-08-06T15:00:00Z", started_at: "2026-08-06T15:01:00Z", finished_at: null,
      };
      mockJobsRepo.findById.mockResolvedValue(mockJob);
      mockJobsRepo.update.mockResolvedValue({});
      mockLogsRepo.create.mockResolvedValue({});

      await ResearchService.cancelJob("job_123");

      expect(mockJobsRepo.update).toHaveBeenCalledWith("job_123", expect.objectContaining({ status: "cancelled" }));
      expect(mockLogsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ job_id: "job_123", message: "Job cancelled by user", level: "warn" })
      );
    });

    it("should throw error when job not found", async () => {
      mockJobsRepo.findById.mockResolvedValue(null);
      await expect(ResearchService.cancelJob("nonexistent")).rejects.toThrow("Job nonexistent not found");
    });

    it("should throw error when job is not running", async () => {
      const mockJob: ResearchJobRow = {
        id: "job_123", source: "reddit", status: "completed",
        items_found: 10, items_processed: 10,
        created_at: "2026-08-06T15:00:00Z", started_at: "2026-08-06T15:01:00Z", finished_at: "2026-08-06T15:05:00Z",
      };
      mockJobsRepo.findById.mockResolvedValue(mockJob);
      await expect(ResearchService.cancelJob("job_123")).rejects.toThrow("Job job_123 is not running (status: completed)");
    });
  });

  describe("getJobWithLogs", () => {
    it("should return job with logs", async () => {
      const mockJob: ResearchJobRow = {
        id: "job_123", source: "reddit", status: "completed",
        items_found: 10, items_processed: 10,
        created_at: "2026-08-06T15:00:00Z", started_at: "2026-08-06T15:01:00Z", finished_at: "2026-08-06T15:05:00Z",
      };
      const mockLogs = [
        { id: "log_1", job_id: "job_123", stage: "collect", message: "Job started", level: "info" as const, created_at: "2026-08-06T15:01:00Z" },
      ];
      mockJobsRepo.findById.mockResolvedValue(mockJob);
      mockLogsRepo.findByJobId.mockResolvedValue(mockLogs);

      const result = await ResearchService.getJobWithLogs("job_123");

      expect(result).toEqual({ job: mockJob, logs: mockLogs });
      expect(mockJobsRepo.findById).toHaveBeenCalledWith("job_123");
      expect(mockLogsRepo.findByJobId).toHaveBeenCalledWith("job_123");
    });

    it("should return empty logs when none exist", async () => {
      const mockJob: ResearchJobRow = {
        id: "job_123", source: "reddit", status: "pending",
        items_found: 0, items_processed: 0,
        created_at: "2026-08-06T15:00:00Z", started_at: null, finished_at: null,
      };
      mockJobsRepo.findById.mockResolvedValue(mockJob);
      mockLogsRepo.findByJobId.mockResolvedValue(null);

      const result = await ResearchService.getJobWithLogs("job_123");
      expect(result).toEqual({ job: mockJob, logs: [] });
    });
  });

  describe("getResearchStats", () => {
    it("should calculate research statistics", async () => {
      mockJobsRepo.count
        .mockResolvedValueOnce(10).mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2).mockResolvedValueOnce(6)
        .mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      const mockCompletedJobs: ResearchJobRow[] = [
        { id: "job_1", source: "reddit", status: "completed", items_found: 10, items_processed: 10,
          created_at: "2026-08-06T14:00:00Z", started_at: "2026-08-06T14:01:00Z", finished_at: "2026-08-06T14:05:00Z" },
        { id: "job_2", source: "github", status: "completed", items_found: 5, items_processed: 5,
          created_at: "2026-08-06T13:00:00Z", started_at: "2026-08-06T13:01:00Z", finished_at: "2026-08-06T13:07:00Z" },
      ];
      mockJobsRepo.list.mockResolvedValue(mockCompletedJobs);

      const result = await ResearchService.getResearchStats();

      expect(result.total).toBe(10);
      expect(result.completed).toBe(6);
      expect(result.successRate).toBe(60);
      expect(result.totalItemsFound).toBe(15);
      expect(result.totalItemsProcessed).toBe(15);
      expect(result.averageDurationMs).toBeGreaterThan(0);
    });

    it("should handle zero jobs", async () => {
      mockJobsRepo.count.mockResolvedValue(0);
      mockJobsRepo.list.mockResolvedValue([]);

      const result = await ResearchService.getResearchStats();

      expect(result.total).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.averageDurationMs).toBe(0);
    });
  });

  describe("getJobLogs", () => {
    it("should return logs for a job", async () => {
      const mockLogs = [
        { id: "log_1", job_id: "job_123", stage: "collect", message: "Started", level: "info" as const, created_at: "2026-08-06T15:01:00Z" },
      ];
      mockLogsRepo.findByJobId.mockResolvedValue(mockLogs);

      const result = await ResearchService.getJobLogs("job_123");
      expect(result).toEqual(mockLogs);
      expect(mockLogsRepo.findByJobId).toHaveBeenCalledWith("job_123");
    });
  });
});
