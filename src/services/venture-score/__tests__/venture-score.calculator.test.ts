/**
 * Sprint 66: Venture Score Calculator Tests
 *
 * Pure function tests — no mocks, no DB.
 */
import { describe, it, expect } from "vitest";
import {
  calculateOverallScore,
  calculateInvestmentGrade,
  calculateConfidence,
  calculateRiskScore,
  calculateROIScore,
  calculateMarketScore,
  calculateExecutionScore,
  calculateInnovationScore,
  calculateFinancialScore,
  calculateValidationScore,
  calculateForecastScore,
  calculateResearchScore,
  calculateRecommendation,
  generateExplanations,
  buildComponentsFromData,
} from "../venture-score.calculator";

// ---------------------------------------------------------------------------
// Helper: full components fixture
// ---------------------------------------------------------------------------
function fullComponents() {
  return {
    opportunity: { id: "opp-1" },
    validation: { available: true, score: 80, confidence: 75 },
    forecast: { available: true, score: 70, trend: 0.15 },
    financial: { available: true, overallScore: 65, ltvCacRatio: 4, breakEvenMonths: 18 },
    research: { available: true, completeness: 80, sources: 5 },
    insights: { available: true, quality: 75 },
    competition: { available: true, score: 60 },
    portfolio: { available: false, similarCount: 0, avgPerformance: 0 },
    backtesting: { available: false, accuracy: 50 },
  } as Parameters<typeof calculateOverallScore>[0];
}

describe("Venture Score Calculator", () => {
  describe("calculateOverallScore", () => {
    it("returns a number between 0 and 100 with all modules available", () => {
      const score = calculateOverallScore(fullComponents());
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("returns fallback score when all modules are missing", () => {
      const score = calculateOverallScore({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof calculateOverallScore>[0]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("higher validation score increases overall", () => {
      const high = calculateOverallScore({
        ...fullComponents(),
        validation: { available: true, score: 95, confidence: 90 },
      });
      const low = calculateOverallScore({
        ...fullComponents(),
        validation: { available: true, score: 20, confidence: 30 },
      });
      expect(high).toBeGreaterThan(low);
    });
  });

  describe("calculateInvestmentGrade", () => {
    it("maps 95+ to AAA", () => {
      expect(calculateInvestmentGrade(95)).toBe("AAA");
      expect(calculateInvestmentGrade(100)).toBe("AAA");
    });
    it("maps 90-94 to AA", () => {
      expect(calculateInvestmentGrade(90)).toBe("AA");
      expect(calculateInvestmentGrade(94)).toBe("AA");
    });
    it("maps 85-89 to A", () => {
      expect(calculateInvestmentGrade(85)).toBe("A");
    });
    it("maps 80-84 to BBB", () => {
      expect(calculateInvestmentGrade(80)).toBe("BBB");
    });
    it("maps 70-79 to BB", () => {
      expect(calculateInvestmentGrade(70)).toBe("BB");
    });
    it("maps 60-69 to B", () => {
      expect(calculateInvestmentGrade(60)).toBe("B");
    });
    it("maps below 60 to Reject", () => {
      expect(calculateInvestmentGrade(59)).toBe("Reject");
      expect(calculateInvestmentGrade(0)).toBe("Reject");
    });
  });

  describe("calculateConfidence", () => {
    it("returns higher confidence when more modules available", () => {
      const high = calculateConfidence(fullComponents());
      const low = calculateConfidence({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof calculateConfidence>[0]);
      expect(high).toBeGreaterThan(low);
    });

    it("returns 0-100 range", () => {
      const c = calculateConfidence(fullComponents());
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(100);
    });
  });

  describe("calculateRiskScore", () => {
    it("higher is better (lower risk)", () => {
      const r = calculateRiskScore(fullComponents());
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    });
  });

  describe("calculateROIScore", () => {
    it("returns fallback for missing financial", () => {
      const r = calculateROIScore({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof calculateROIScore>[0]);
      expect(r).toBe(30);
    });

    it("rewards high LTV/CAC ratio", () => {
      const high = calculateROIScore({
        ...fullComponents(),
        financial: { available: true, overallScore: 70, ltvCacRatio: 8, breakEvenMonths: 12 },
      });
      const low = calculateROIScore({
        ...fullComponents(),
        financial: { available: true, overallScore: 40, ltvCacRatio: 1, breakEvenMonths: 48 },
      });
      expect(high).toBeGreaterThan(low);
    });
  });

  describe("calculateMarketScore", () => {
    it("uses research + validation + competition", () => {
      const s = calculateMarketScore(fullComponents());
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    });
  });

  describe("calculateExecutionScore", () => {
    it("returns fallback for missing modules", () => {
      const s = calculateExecutionScore({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof calculateExecutionScore>[0]);
      expect(s).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateInnovationScore", () => {
    it("returns fallback for missing research", () => {
      const s = calculateInnovationScore({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof calculateInnovationScore>[0]);
      expect(s).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateFinancialScore", () => {
    it("returns fallback for missing financial", () => {
      const s = calculateFinancialScore({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof calculateFinancialScore>[0]);
      expect(s).toBe(30);
    });
  });

  describe("calculateValidationScore", () => {
    it("returns fallback for missing validation", () => {
      const s = calculateValidationScore({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof calculateValidationScore>[0]);
      expect(s).toBe(50);
    });

    it("returns validation score when available", () => {
      const s = calculateValidationScore(fullComponents());
      expect(s).toBe(80);
    });
  });

  describe("calculateForecastScore", () => {
    it("returns fallback for missing forecast", () => {
      const s = calculateForecastScore({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof calculateForecastScore>[0]);
      expect(s).toBe(50);
    });
  });

  describe("calculateResearchScore", () => {
    it("returns fallback for missing research", () => {
      const s = calculateResearchScore({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof calculateResearchScore>[0]);
      expect(s).toBe(40);
    });
  });

  describe("calculateRecommendation", () => {
    it("Strong Buy for high score + confidence + low risk", () => {
      expect(calculateRecommendation(90, 80, 20)).toBe("Strong Buy");
    });

    it("Buy for good score + decent confidence", () => {
      expect(calculateRecommendation(82, 70, 40)).toBe("Buy");
    });

    it("Watch for moderate score", () => {
      expect(calculateRecommendation(75, 50, 50)).toBe("Watch");
    });

    it("Speculative for low-moderate score", () => {
      expect(calculateRecommendation(55, 40, 60)).toBe("Speculative");
    });

    it("Reject for very low score", () => {
      expect(calculateRecommendation(30, 20, 80)).toBe("Reject");
    });
  });

  describe("generateExplanations", () => {
    it("generates strengths for good scores", () => {
      const { strengths } = generateExplanations(fullComponents());
      expect(strengths.length).toBeGreaterThan(0);
    });

    it("generates weaknesses for missing modules", () => {
      const { weaknesses } = generateExplanations({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof generateExplanations>[0]);
      expect(weaknesses.length).toBeGreaterThan(0);
    });

    it("lists missing financial as weakness", () => {
      const { weaknesses } = generateExplanations({
        opportunity: { id: "opp-1" },
      } as Parameters<typeof generateExplanations>[0]);
      expect(weaknesses.some((w) => w.toLowerCase().includes("financial"))).toBe(true);
    });
  });

  describe("buildComponentsFromData", () => {
    it("converts raw data to components shape", () => {
      const data = {
        opportunity: { id: "opp-1" },
        validation: { overall_score: 75, confidence: 80 },
        forecast: { overall_score: 65, growth_rate: 0.1 },
        financial: { overall_score: 55, ltv_cac_ratio: 3, break_even_months: 24 },
        research: { completeness: 70, sources_count: 4 },
        insights: { quality: 80 },
        competition: { competition_score: 55 },
        portfolio: { similar_count: 2, avg_performance: 60 },
        backtesting: { accuracy: 70 },
      };
      const components = buildComponentsFromData(data);

      expect(components.validation.available).toBe(true);
      expect(components.validation.score).toBe(75);
      expect(components.forecast.available).toBe(true);
      expect(components.forecast.score).toBe(65);
      expect(components.financial.available).toBe(true);
      expect(components.financial.overallScore).toBe(55);
      expect(components.research.available).toBe(true);
      expect(components.research.completeness).toBe(70);
      expect(components.insights.available).toBe(true);
      expect(components.insights.quality).toBe(80);
      expect(components.competition.available).toBe(true);
      expect(components.competition.score).toBe(55);
      expect(components.portfolio.available).toBe(true);
      expect(components.portfolio.similarCount).toBe(2);
      expect(components.backtesting.available).toBe(true);
      expect(components.backtesting.accuracy).toBe(70);
    });

    it("handles missing modules gracefully", () => {
      const components = buildComponentsFromData({
        opportunity: { id: "opp-1" },
      });
      expect(components.validation.available).toBe(false);
      expect(components.forecast.available).toBe(false);
      expect(components.financial.available).toBe(false);
      expect(components.research.available).toBe(false);
    });
  });
});
