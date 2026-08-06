/**
 * Sprint 71 H4: Test coverage for venture-studio.service.ts
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// ===== HOISTED MOCKS =====

const {
  mockProjectsRepo,
  mockCanvasRepo,
  mockGtmRepo,
  mockMvpRepo,
  mockScoresRepo,
  mockOpportunityRepo,
  mockIdeasRepo,
} = vi.hoisted(() => ({
  mockProjectsRepo: {
    create: vi.fn(),
    findById: vi.fn(),
    findByOpportunity: vi.fn(),
    list: vi.fn(),
    getStats: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockCanvasRepo: {
    create: vi.fn(),
    findByProject: vi.fn(),
    deleteByProject: vi.fn(),
  },
  mockGtmRepo: {
    create: vi.fn(),
    findByProject: vi.fn(),
    deleteByProject: vi.fn(),
  },
  mockMvpRepo: {
    create: vi.fn(),
    findByProject: vi.fn(),
    deleteByProject: vi.fn(),
    count: vi.fn(),
  },
  mockScoresRepo: {
    findByOpportunity: vi.fn(),
    list: vi.fn(),
  },
  mockOpportunityRepo: {
    findById: vi.fn(),
  },
  mockIdeasRepo: {
    list: vi.fn(),
  },
}));

// ===== MOCK MODULES =====

function createStaticMock(repo: any) {
  const MockClass = function () { return repo; };
  (MockClass as any).create = vi.fn().mockResolvedValue(repo);
  return MockClass;
}

vi.mock("@/lib/db/repositories/venture-projects.repository", () => ({
  VentureProjectsRepository: createStaticMock(mockProjectsRepo),
}));
vi.mock("@/lib/db/repositories/venture-canvas.repository", () => ({
  VentureCanvasRepository: createStaticMock(mockCanvasRepo),
}));
vi.mock("@/lib/db/repositories/venture-gtm.repository", () => ({
  VentureGtmRepository: createStaticMock(mockGtmRepo),
}));
vi.mock("@/lib/db/repositories/venture-mvp.repository", () => ({
  VentureMvpRepository: createStaticMock(mockMvpRepo),
}));
vi.mock("@/lib/db/repositories/startup-scores.repository", () => ({
  StartupScoresRepository: createStaticMock(mockScoresRepo),
}));
vi.mock("@/lib/db/repositories/opportunities.repository", () => ({
  OpportunitiesRepository: createStaticMock(mockOpportunityRepo),
}));
vi.mock("@/lib/db/repositories/startup-ideas.repository", () => ({
  StartupIdeasRepository: createStaticMock(mockIdeasRepo),
}));

// Mock AI provider
vi.mock("@/lib/ai", () => ({
  getAIProviderFromEnv: vi.fn(),
  createAIProvider: vi.fn(),
}));

// ===== IMPORTS =====

import * as VentureStudioService from "@/services/venture-studio/venture-studio.service";
import { getAIProviderFromEnv, createAIProvider } from "@/lib/ai";

// ===== TESTS =====

describe("VentureStudioService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generateVentureProject", () => {
    it("should skip when opportunity not found", async () => {
      mockOpportunityRepo.findById.mockResolvedValue(null);

      const result = await VentureStudioService.generateVentureProject("opp_123");

      expect(result).toEqual({ processed: 0, generated: 0, skipped: 0, inserted: 0 });
    });

    it("should skip when no startup score exists", async () => {
      mockOpportunityRepo.findById.mockResolvedValue({ id: "opp_123" });
      mockScoresRepo.findByOpportunity.mockResolvedValue(null);

      const result = await VentureStudioService.generateVentureProject("opp_123");

      expect(result).toEqual({ processed: 1, generated: 0, skipped: 1, inserted: 0 });
    });

    it("should skip when score below threshold", async () => {
      mockOpportunityRepo.findById.mockResolvedValue({ id: "opp_123" });
      mockScoresRepo.findByOpportunity.mockResolvedValue({ overall_score: 50 });

      const result = await VentureStudioService.generateVentureProject("opp_123");

      expect(result).toEqual({ processed: 1, generated: 0, skipped: 1, inserted: 0 });
    });

    it("should skip when project already exists (idempotent)", async () => {
      mockOpportunityRepo.findById.mockResolvedValue({ id: "opp_123" });
      mockScoresRepo.findByOpportunity.mockResolvedValue({ overall_score: 80 });
      mockProjectsRepo.findByOpportunity.mockResolvedValue({ id: "existing_project" });

      const result = await VentureStudioService.generateVentureProject("opp_123");

      expect(result).toEqual({ processed: 1, generated: 0, skipped: 1, inserted: 0 });
    });

    it("should generate venture project (happy path)", async () => {
      mockOpportunityRepo.findById.mockResolvedValue({
        id: "opp_123", title: "AI Tool", description: "Desc", frequency: 10,
      });
      mockScoresRepo.findByOpportunity.mockResolvedValue({ overall_score: 85 });
      mockProjectsRepo.findByOpportunity.mockResolvedValue(null);
      mockProjectsRepo.create.mockResolvedValue({ id: "proj_1", opportunity_id: "opp_123" });
      mockIdeasRepo.list.mockResolvedValue([]);
      mockCanvasRepo.create.mockResolvedValue({});
      mockGtmRepo.create.mockResolvedValue({});
      mockMvpRepo.create.mockResolvedValue({});

      const mockProvider = {
        generateVentureProject: vi.fn().mockResolvedValue([{
          name: "AI Startup", tagline: "Build fast", overall_score: 88,
          canvas: {
            problem: "P", solution: "S", value_proposition: "VP",
            customer_segments: "CS", channels: "CH", customer_relationships: "CR",
            key_activities: "KA", key_resources: "KR", key_partners: "KP",
            cost_structure: "CS", revenue_streams: "RS",
          },
          gtm: {
            launch_strategy: "LS", acquisition_channels: "AC",
            pricing_strategy: "PS", growth_loops: "GL",
            marketing_plan: "MP", sales_plan: "SP",
          },
          mvp: {
            core_features: "CF", roadmap: "R", tech_stack: "TS",
            estimated_cost: "$10k", estimated_time: "3 months", risks: "R",
          },
        }]),
      };

      vi.mocked(createAIProvider).mockReturnValue(mockProvider as any);

      const result = await VentureStudioService.generateVentureProject("opp_123", "mock");

      expect(result).toEqual({ processed: 1, generated: 1, skipped: 0, inserted: 1 });
      expect(mockProjectsRepo.create).toHaveBeenCalledTimes(1);
      expect(mockCanvasRepo.create).toHaveBeenCalledTimes(1);
      expect(mockGtmRepo.create).toHaveBeenCalledTimes(1);
      expect(mockMvpRepo.create).toHaveBeenCalledTimes(1);
    });

    it("should handle AI returning empty result", async () => {
      mockOpportunityRepo.findById.mockResolvedValue({ id: "opp_123" });
      mockScoresRepo.findByOpportunity.mockResolvedValue({ overall_score: 80 });
      mockProjectsRepo.findByOpportunity.mockResolvedValue(null);
      mockIdeasRepo.list.mockResolvedValue([]);

      const mockProvider = { generateVentureProject: vi.fn().mockResolvedValue([]) };
      vi.mocked(createAIProvider).mockReturnValue(mockProvider as any);

      const result = await VentureStudioService.generateVentureProject("opp_123", "mock");

      expect(result).toEqual({ processed: 1, generated: 0, skipped: 0, inserted: 0 });
      expect(mockProjectsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("getTopProjects", () => {
    it("should return top projects", async () => {
      const mockProjects = [{ id: "p1" }, { id: "p2" }];
      mockProjectsRepo.list.mockResolvedValue(mockProjects);

      const result = await VentureStudioService.getTopProjects(10);

      expect(result).toEqual(mockProjects);
      expect(mockProjectsRepo.list).toHaveBeenCalledWith({ limit: 10, orderBy: "overall_score", ascending: false });
    });
  });

  describe("getStatistics", () => {
    it("should return stats with MVP cost", async () => {
      mockProjectsRepo.getStats.mockResolvedValue({ total: 5, active: 3 });
      mockMvpRepo.count.mockResolvedValue(3);

      const result = await VentureStudioService.getStatistics();

      expect(result.total).toBe(5);
      expect(result.averageMvpCost).toBe("$15,000-$25,000");
    });
  });

  describe("getProjectDetail", () => {
    it("should return null when project not found", async () => {
      mockProjectsRepo.findById.mockResolvedValue(null);

      const result = await VentureStudioService.getProjectDetail("proj_123");
      expect(result).toBeNull();
    });

    it("should return full detail", async () => {
      const mockProject = { id: "proj_123" };
      mockProjectsRepo.findById.mockResolvedValue(mockProject);
      mockCanvasRepo.findByProject.mockResolvedValue({ problem: "P" });
      mockGtmRepo.findByProject.mockResolvedValue({ launch_strategy: "LS" });
      mockMvpRepo.findByProject.mockResolvedValue({ core_features: "CF" });

      const result = await VentureStudioService.getProjectDetail("proj_123");

      expect(result).toEqual({
        project: mockProject,
        canvas: { problem: "P" },
        gtm: { launch_strategy: "LS" },
        mvp: { core_features: "CF" },
      });
    });
  });

  describe("deleteProject", () => {
    it("should delete all related records", async () => {
      await VentureStudioService.deleteProject("proj_123");

      expect(mockCanvasRepo.deleteByProject).toHaveBeenCalledWith("proj_123");
      expect(mockGtmRepo.deleteByProject).toHaveBeenCalledWith("proj_123");
      expect(mockMvpRepo.deleteByProject).toHaveBeenCalledWith("proj_123");
      expect(mockProjectsRepo.delete).toHaveBeenCalledWith("proj_123");
    });
  });

  describe("archiveProject", () => {
    it("should archive a project", async () => {
      mockProjectsRepo.update.mockResolvedValue({ id: "proj_123", status: "archived" });

      const result = await VentureStudioService.archiveProject("proj_123");

      expect(result.status).toBe("archived");
      expect(mockProjectsRepo.update).toHaveBeenCalledWith("proj_123", { status: "archived" });
    });
  });

  describe("generateLaunchChecklist", () => {
    it("should return checklist with categories", () => {
      const detail = { project: {}, canvas: {}, gtm: {}, mvp: { estimated_cost: "$20k" } } as any;
      const checklist = VentureStudioService.generateLaunchChecklist(detail);

      expect(checklist.length).toBeGreaterThan(0);
      expect(checklist.map((c) => c.category)).toContain("Payments");
      // Check that estimated_cost is referenced
      const payments = checklist.find((c) => c.category === "Payments");
      expect(payments?.items.some((i) => i.includes("$20k"))).toBe(true);
    });
  });

  describe("generatePricingRecommendation", () => {
    it("should return pricing models", () => {
      const detail = {} as any;
      const models = VentureStudioService.generatePricingRecommendation(detail);

      expect(models.length).toBeGreaterThan(0);
      expect(models.some((m) => m.recommended)).toBe(true);
    });
  });

  describe("generateGtmRecommendation", () => {
    it("should return GTM channels", () => {
      const detail = {} as any;
      const channels = VentureStudioService.generateGtmRecommendation(detail);

      expect(channels.length).toBeGreaterThan(0);
      expect(channels.some((c) => c.channel === "SEO")).toBe(true);
    });
  });
});
