import { describe, it, expect } from "vitest";
import {
  toJson,
  toMarkdown,
  toCsv,
  toPdfHtml,
  renderFinancial,
  financialFilename,
  mimeFor,
} from "../financial-export";
import type { FinancialModelDetail } from "@/types/financial";

const mockDetail: FinancialModelDetail = {
  model: {
    id: "fm-1",
    venture_project_id: "proj-1",
    currency: "USD",
    projection_years: 5,
    assumptions: { averagePrice: 99, conversionRate: 0.03, monthlyGrowthRate: 0.08, churnRate: 0.05, grossMargin: 0.75, cac: 120, supportCost: 5000, hostingCost: 2000, payroll: 80000, marketingBudget: 10000, salesCost: 15000, infrastructure: 3000 },
    created_at: "2026-07-03T00:00:00Z",
    updated_at: "2026-07-03T00:00:00Z",
  },
  projections: [
    { id: "fp-1", financial_model_id: "fm-1", year: 1, revenue: 600000, cogs: 150000, gross_profit: 450000, operating_expenses: 380000, ebitda: 70000, net_profit: 59500, cash_balance: 159500, created_at: "2026-07-03T00:00:00Z" },
    { id: "fp-2", financial_model_id: "fm-1", year: 2, revenue: 1500000, cogs: 375000, gross_profit: 1125000, operating_expenses: 750000, ebitda: 375000, net_profit: 318750, cash_balance: 478250, created_at: "2026-07-03T00:00:00Z" },
    { id: "fp-3", financial_model_id: "fm-1", year: 3, revenue: 3750000, cogs: 937500, gross_profit: 2812500, operating_expenses: 1500000, ebitda: 1312500, net_profit: 1115625, cash_balance: 1593875, created_at: "2026-07-03T00:00:00Z" },
  ],
  unitEconomics: {
    id: "ue-1",
    financial_model_id: "fm-1",
    cac: 120,
    ltv: 1188,
    ltv_cac_ratio: 9.9,
    payback_months: 2,
    gross_margin: 75,
    arpu: 99,
    monthly_churn: 0.05,
    created_at: "2026-07-03T00:00:00Z",
  },
  breakEven: {
    id: "be-1",
    financial_model_id: "fm-1",
    monthly_fixed_cost: 115000,
    gross_margin: 75,
    break_even_revenue: 153333,
    break_even_customers: 1549,
    estimated_break_even_month: 14,
    created_at: "2026-07-03T00:00:00Z",
  },
  ventureProjectName: "Test Financial Project",
};

describe("financial-export", () => {
  describe("toJson", () => {
    it("returns valid JSON", () => {
      const result = toJson(mockDetail);
      const parsed = JSON.parse(result);
      expect(parsed.model.id).toBe("fm-1");
      expect(parsed.projections).toHaveLength(3);
      expect(parsed.unitEconomics.cac).toBe(120);
      expect(parsed.breakEven.break_even_customers).toBe(1549);
    });
  });

  describe("toMarkdown", () => {
    it("returns markdown with project name", () => {
      const result = toMarkdown(mockDetail);
      expect(result).toContain("# Financial Model — Test Financial Project");
      expect(result).toContain("## Revenue Projections");
      expect(result).toContain("## Unit Economics");
      expect(result).toContain("## Break-Even Analysis");
    });

    it("includes table data", () => {
      const result = toMarkdown(mockDetail);
      expect(result).toContain("| 1 |");
      expect(result).toContain("| 2 |");
      expect(result).toContain("| 3 |");
      expect(result).toContain("9.9x");
    });
  });

  describe("toCsv", () => {
    it("returns CSV with headers and rows", () => {
      const result = toCsv(mockDetail);
      const lines = result.split("\n");
      expect(lines[0]).toContain("Year");
      expect(lines[0]).toContain("Revenue");
      expect(lines[1]).toContain("1,");
      expect(lines[1]).toContain("600000");
      expect(lines).toHaveLength(4); // header + 3 rows
    });
  });

  describe("toPdfHtml", () => {
    it("returns valid HTML", () => {
      const result = toPdfHtml(mockDetail);
      expect(result).toContain("<!doctype html>");
      expect(result).toContain("Test Financial Project");
      expect(result).toContain("Revenue Projections");
    });
  });

  describe("renderFinancial", () => {
    it("renders as json", () => {
      const result = renderFinancial(mockDetail, "json");
      expect(JSON.parse(result).model.id).toBe("fm-1");
    });

    it("renders as markdown", () => {
      const result = renderFinancial(mockDetail, "markdown");
      expect(result).toContain("# Financial Model");
    });

    it("renders as csv", () => {
      const result = renderFinancial(mockDetail, "csv");
      expect(result).toContain("Year,Revenue");
    });

    it("renders as pdf", () => {
      const result = renderFinancial(mockDetail, "pdf");
      expect(result).toContain("<!doctype html>");
    });
  });

  describe("financialFilename", () => {
    it("returns a slugified filename", () => {
      const result = financialFilename(mockDetail, "markdown");
      expect(result).toBe("test-financial-project-financial.md");
    });

    it("returns csv extension", () => {
      const result = financialFilename(mockDetail, "csv");
      expect(result).toBe("test-financial-project-financial.csv");
    });
  });

  describe("mimeFor", () => {
    it("returns correct MIME types", () => {
      expect(mimeFor("json")).toBe("application/json; charset=utf-8");
      expect(mimeFor("markdown")).toBe("text/markdown; charset=utf-8");
      expect(mimeFor("csv")).toBe("text/csv; charset=utf-8");
      expect(mimeFor("pdf")).toBe("application/pdf");
    });
  });
});
