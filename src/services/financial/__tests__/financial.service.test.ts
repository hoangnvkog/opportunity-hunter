/**
 * Sprint 71 H4: Test coverage for financial.service.ts
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// ===== HOISTED MOCKS =====

const {
  mockModelsRepo,
  mockProjectionsRepo,
  mockUnitEconRepo,
  mockBreakEvenRepo,
  mockProjectsRepo,
} = vi.hoisted(() => ({
  mockModelsRepo: {
    create: vi.fn(),
    findById: vi.fn(),
    findByVentureProject: vi.fn(),
    list: vi.fn(),
    listCards: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  mockProjectionsRepo: {
    createMany: vi.fn(),
    findByModel: vi.fn(),
    deleteByModel: vi.fn(),
  },
  mockUnitEconRepo: {
    create: vi.fn(),
    findByModel: vi.fn(),
    deleteByModel: vi.fn(),
  },
  mockBreakEvenRepo: {
    create: vi.fn(),
    findByModel: vi.fn(),
    deleteByModel: vi.fn(),
  },
  mockProjectsRepo: {
    findById: vi.fn(),
    list: vi.fn(),
  },
}));

function createStaticMock(repo: any) {
  const MockClass = function () { return repo; };
  (MockClass as any).create = vi.fn().mockResolvedValue(repo);
  return MockClass;
}

// Mock repositories barrel
vi.mock("@/lib/db/repositories", () => ({
  FinancialModelsRepository: createStaticMock(mockModelsRepo),
  FinancialProjectionsRepository: createStaticMock(mockProjectionsRepo),
  UnitEconomicsRepository: createStaticMock(mockUnitEconRepo),
  BreakEvenRepository: createStaticMock(mockBreakEvenRepo),
  VentureProjectsRepository: createStaticMock(mockProjectsRepo),
}));

// Mock AI provider
vi.mock("@/lib/ai", () => ({
  getAIProviderFromEnv: vi.fn(),
  createAIProvider: vi.fn(),
}));

// ===== IMPORTS =====

import * as FinancialService from "@/services/financial/financial.service";
import { getAIProviderFromEnv } from "@/lib/ai";
import type { FinancialModelDetail } from "@/types/financial";

// ===== TESTS =====

describe("FinancialService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generateFinancialModel", () => {
    it("should skip when project not found", async () => {
      mockProjectsRepo.findById.mockResolvedValue(null);

      const result = await FinancialService.generateFinancialModel("proj_123");

      expect(result).toEqual({ inserted: false, skipped: true });
    });

    it("should skip when score below threshold", async () => {
      mockProjectsRepo.findById.mockResolvedValue({ id: "proj_123", overall_score: 50 });

      const result = await FinancialService.generateFinancialModel("proj_123");

      expect(result).toEqual({ inserted: false, skipped: true });
    });

    it("should skip when model already exists", async () => {
      mockProjectsRepo.findById.mockResolvedValue({ id: "proj_123", overall_score: 80 });
      mockModelsRepo.findByVentureProject.mockResolvedValue({ id: "existing_model" });

      const result = await FinancialService.generateFinancialModel("proj_123");

      expect(result).toEqual({ inserted: false, skipped: true });
    });

    it("should generate financial model (happy path)", async () => {
      mockProjectsRepo.findById.mockResolvedValue({
        id: "proj_123", name: "AI Startup", tagline: "Build fast", overall_score: 80,
      });
      mockModelsRepo.findByVentureProject.mockResolvedValue(null);
      mockModelsRepo.create.mockResolvedValue({ id: "model_1" });
      mockProjectionsRepo.createMany.mockResolvedValue([]);
      mockUnitEconRepo.create.mockResolvedValue({});
      mockBreakEvenRepo.create.mockResolvedValue({});

      const mockProvider = {
        generateFinancialModel: vi.fn().mockResolvedValue({
          currency: "USD",
          projectionYears: 5,
          assumptions: "A",
          projections: [
            { year: 1, revenue: 100000, cogs: 30000, grossProfit: 70000, operatingExpenses: 50000, ebitda: 20000, netProfit: 15000, cashBalance: 50000 },
          ],
          unitEconomics: { cac: 100, ltv: 500, ltvCacRatio: 5, paybackMonths: 3, grossMargin: 70, arpu: 50, monthlyChurn: 0.05 },
          breakEven: { monthlyFixedCost: 10000, grossMargin: 70, breakEvenRevenue: 15000, breakEvenCustomers: 300, estimatedBreakEvenMonth: 8 },
          projectedARR: 100000,
          runwayMonths: 18,
          breakEvenMonth: 8,
        }),
      };

      vi.mocked(getAIProviderFromEnv).mockReturnValue(mockProvider as any);

      const result = await FinancialService.generateFinancialModel("proj_123");

      expect(result).toEqual({ inserted: true, skipped: false });
      expect(mockModelsRepo.create).toHaveBeenCalledTimes(1);
      expect(mockProjectionsRepo.createMany).toHaveBeenCalledTimes(1);
      expect(mockUnitEconRepo.create).toHaveBeenCalledTimes(1);
      expect(mockBreakEvenRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("getDashboardStats", () => {
    it("should return zero stats when no models", async () => {
      mockModelsRepo.count.mockResolvedValue(0);
      mockModelsRepo.listCards.mockResolvedValue([]);

      const result = await FinancialService.getDashboardStats();

      expect(result.totalModels).toBe(0);
      expect(result.projectedARR).toBe(0);
    });

    it("should aggregate stats from models", async () => {
      mockModelsRepo.count.mockResolvedValue(1);
      mockModelsRepo.listCards.mockResolvedValue([{ id: "m1" }]);
      mockModelsRepo.findById.mockResolvedValue({ id: "m1", overall_score: 80 });
      mockProjectionsRepo.findByModel.mockResolvedValue([
        { id: "p1", financial_model_id: "m1", year: 1, revenue: 200000, cogs: 60000, gross_profit: 140000, operating_expenses: 80000, ebitda: 60000, net_profit: 30000, cash_balance: 100000, created_at: "" },
        { id: "p5", financial_model_id: "m1", year: 5, revenue: 1000000, cogs: 300000, gross_profit: 700000, operating_expenses: 300000, ebitda: 400000, net_profit: 400000, cash_balance: 500000, created_at: "" },
      ]);
      mockUnitEconRepo.findByModel.mockResolvedValue({ ltv_cac_ratio: 4 });

      const result = await FinancialService.getDashboardStats();

      expect(result.totalModels).toBe(1);
      expect(result.projectedARR).toBe(200000);
      expect(result.ltvCacRatio).toBe(4);
    });
  });

  describe("getModelDetail", () => {
    it("should return null when model not found", async () => {
      mockModelsRepo.findById.mockResolvedValue(null);

      const result = await FinancialService.getModelDetail("model_123");
      expect(result).toBeNull();
    });

    it("should return full detail", async () => {
      mockModelsRepo.findById.mockResolvedValue({ id: "m1", venture_project_id: "proj_1" });
      mockProjectionsRepo.findByModel.mockResolvedValue([{ year: 1 }]);
      mockUnitEconRepo.findByModel.mockResolvedValue({ cac: 100 });
      mockBreakEvenRepo.findByModel.mockResolvedValue({ estimated_break_even_month: 12 });
      mockProjectsRepo.findById.mockResolvedValue({ name: "AI Startup" });

      const result = await FinancialService.getModelDetail("m1");

      expect(result).not.toBeNull();
      expect(result!.ventureProjectName).toBe("AI Startup");
      expect(result!.unitEconomics).toEqual({ cac: 100 });
    });
  });

  describe("deleteModel", () => {
    it("should delete all child records then model", async () => {
      await FinancialService.deleteModel("model_123");

      expect(mockProjectionsRepo.deleteByModel).toHaveBeenCalledWith("model_123");
      expect(mockUnitEconRepo.deleteByModel).toHaveBeenCalledWith("model_123");
      expect(mockBreakEvenRepo.deleteByModel).toHaveBeenCalledWith("model_123");
      expect(mockModelsRepo.delete).toHaveBeenCalledWith("model_123");
    });
  });

  describe("getInvestmentRecommendation", () => {
    const baseDetail: FinancialModelDetail = {
      model: { id: "m1", venture_project_id: "p1", currency: "USD", projection_years: 5, assumptions: "" } as any,
      projections: [],
      unitEconomics: null,
      breakEven: null,
      ventureProjectName: "Test",
    };

    it("should recommend Bootstrap when no financial data", () => {
      const result = FinancialService.getInvestmentRecommendation(baseDetail);
      expect(result.stage).toBe("Bootstrap");
      expect(result.recommended).toBe(true);
    });

    it("should recommend Series A for strong metrics", () => {
      const detail = {
        ...baseDetail,
        unitEconomics: { ltv_cac_ratio: 6, gross_margin: 75 } as any,
        breakEven: { estimated_break_even_month: 10 } as any,
      };
      const result = FinancialService.getInvestmentRecommendation(detail);
      expect(result.stage).toBe("Series A");
      expect(result.recommended).toBe(true);
    });

    it("should recommend Seed for good metrics", () => {
      const detail = {
        ...baseDetail,
        unitEconomics: { ltv_cac_ratio: 4, gross_margin: 65 } as any,
        breakEven: { estimated_break_even_month: 15 } as any,
      };
      const result = FinancialService.getInvestmentRecommendation(detail);
      expect(result.stage).toBe("Seed");
      expect(result.recommended).toBe(true);
    });

    it("should recommend Angel for moderate metrics", () => {
      const detail = {
        ...baseDetail,
        unitEconomics: { ltv_cac_ratio: 2.5, gross_margin: 55 } as any,
        breakEven: { estimated_break_even_month: 20 } as any,
      };
      const result = FinancialService.getInvestmentRecommendation(detail);
      expect(result.stage).toBe("Angel");
    });

    it("should not recommend for LTV/CAC below 1", () => {
      const detail = {
        ...baseDetail,
        unitEconomics: { ltv_cac_ratio: 0.5, gross_margin: 30 } as any,
        breakEven: { estimated_break_even_month: 36 } as any,
      };
      const result = FinancialService.getInvestmentRecommendation(detail);
      expect(result.stage).toBe("Not Recommended");
      expect(result.recommended).toBe(false);
    });
  });

  describe("getRiskAssessment", () => {
    it("should return 6 risk categories", () => {
      const detail: FinancialModelDetail = {
        model: { id: "m1", venture_project_id: "p1", currency: "USD", projection_years: 5, assumptions: "" } as any,
        projections: [
          { year: 1, revenue: 100000 } as any,
          { year: 5, revenue: 500000 } as any,
        ],
        unitEconomics: { ltv_cac_ratio: 4, gross_margin: 70 } as any,
        breakEven: { estimated_break_even_month: 12 } as any,
        ventureProjectName: "Test",
      };

      const risks = FinancialService.getRiskAssessment(detail);

      expect(risks).toHaveLength(6);
      expect(risks.map((r) => r.category)).toContain("Revenue Risk");
      expect(risks.map((r) => r.category)).toContain("Execution Risk");
      expect(risks.every((r) => r.score >= 0 && r.score <= 100)).toBe(true);
    });
  });

  describe("getFinancialSummary", () => {
    it("should generate markdown summary", () => {
      const detail: FinancialModelDetail = {
        model: { id: "m1", venture_project_id: "p1", currency: "USD", projection_years: 5, assumptions: "Assumption" } as any,
        projections: [
          { id: "p1", financial_model_id: "m1", year: 1, revenue: 100000, cogs: 30000, gross_profit: 70000, operating_expenses: 50000, ebitda: 20000, net_profit: 15000, cash_balance: 50000, created_at: "" },
          { id: "p3", financial_model_id: "m1", year: 3, revenue: 300000, cogs: 90000, gross_profit: 210000, operating_expenses: 100000, ebitda: 110000, net_profit: 60000, cash_balance: 200000, created_at: "" },
          { id: "p5", financial_model_id: "m1", year: 5, revenue: 800000, cogs: 240000, gross_profit: 560000, operating_expenses: 200000, ebitda: 360000, net_profit: 200000, cash_balance: 500000, created_at: "" },
        ],
        unitEconomics: { cac: 100, ltv: 500, ltv_cac_ratio: 5, arpu: 50, gross_margin: 70, monthly_churn: 0.05, payback_months: 3 } as any,
        breakEven: { monthly_fixed_cost: 10000, break_even_revenue: 15000, break_even_customers: 300, estimated_break_even_month: 8 } as any,
        ventureProjectName: "AI Startup",
      };

      const summary = FinancialService.getFinancialSummary(detail);

      expect(summary).toContain("AI Startup");
      expect(summary).toContain("USD");
      expect(summary).toContain("Year 1");
      expect(summary).toContain("Year 3");
      expect(summary).toContain("Year 5");
      expect(summary).toContain("Unit Economics");
      expect(summary).toContain("Break-Even");
      expect(summary).toContain("$100");
      expect(summary).toContain("5.0x");
    });
  });
});
