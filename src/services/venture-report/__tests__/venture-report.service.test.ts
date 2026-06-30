/**
 * Sprint 57: Venture Report Service Tests
 *
 * Unit tests for the venture-report orchestration layer.
 * Validates: gate by startup_score overall_score >= 80,
 * STRONG BUY triggers VC Grade Opportunity alert, idempotency, batch processing.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  reportsRepo: {
    create: vi.fn(),
    findByOpportunity: vi.fn(),
    list: vi.fn(),
    listCards: vi.fn(),
    count: vi.fn(),
    averageConfidence: vi.fn(),
    investmentGradeCount: vi.fn(),
    strongBuyCount: vi.fn(),
    latestReportDate: vi.fn(),
    getStats: vi.fn(),
    getConfidenceDistribution: vi.fn(),
    getRecommendationBreakdown: vi.fn(),
    getHistory: vi.fn(),
    findLatest: vi.fn(),
  },
  scoresRepo: {
    findByOpportunity: vi.fn(),
    listCards: vi.fn(),
  },
  opportunityRepo: {
    findById: vi.fn(),
    findByIds: vi.fn(),
  },
  alertsRepo: {
    create: vi.fn(),
    findByWatchlistAndOpportunity: vi.fn(),
  },
  matchingService: {
    matchOpportunityToWatchlists: vi.fn(),
  },
  emailService: {
    queueAlertEmail: vi.fn(),
  },
  mockProvider: {
    generateVentureReport: vi.fn(),
  },
}));

vi.mock("@/lib/db/repositories/venture-reports.repository", () => ({
  VentureReportsRepository: {
    create: vi.fn().mockResolvedValue(mocks.reportsRepo),
  },
  INVESTMENT_GRADE_CONFIDENCE_THRESHOLD: 80,
}));

vi.mock("@/lib/db/repositories/startup-scores.repository", () => ({
  StartupScoresRepository: {
    create: vi.fn().mockResolvedValue(mocks.scoresRepo),
  },
  INVESTMENT_GRADE_ALERT_THRESHOLD: 90,
}));

vi.mock("@/lib/db/repositories/opportunities.repository", () => ({
  OpportunitiesRepository: {
    create: vi.fn().mockResolvedValue(mocks.opportunityRepo),
  },
}));

vi.mock("@/lib/db/repositories/alerts.repository", () => ({
  AlertsRepository: class {
    findByWatchlistAndOpportunity = mocks.alertsRepo.findByWatchlistAndOpportunity;
    create = mocks.alertsRepo.create;
  },
}));

vi.mock("@/services/matching/matching.service", () => ({
  MatchingService: class {
    matchOpportunityToWatchlists = mocks.matchingService.matchOpportunityToWatchlists;
  },
}));

vi.mock("@/services/email/email.service", () => ({
  EmailService: {
    create: vi.fn().mockResolvedValue(mocks.emailService),
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/ai", () => ({
  createAIProvider: vi.fn(() => mocks.mockProvider),
  getAIProviderFromEnv: vi.fn(() => mocks.mockProvider),
}));

import {
  generate,
  generateBatch,
  getTopReports,
  getStatistics,
  getOpportunityReport,
  getInvestmentGradeCount,
  VENTURE_REPORT_SCORE_THRESHOLD,
} from "../venture-report.service";

describe("VentureReportService", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // generate()
  // ---------------------------------------------------------------------------
  describe("generate()", () => {
    it("returns zeros when opportunity does not exist", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue(null);
      const result = await generate("opp-missing");
      expect(result).toEqual({ processed: 0, generated: 0, skipped: 0, inserted: 0 });
    });

    it("returns skipped when startup_score is missing", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "T", description: "d", frequency: 3, severity: "0.7", buying_intent: "0.7",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue(null);

      const result = await generate("opp-1");
      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it("returns skipped when startup_score < 80", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "T", description: "d", frequency: 3, severity: "0.7", buying_intent: "0.7",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "s-1", overall_score: "65" });

      const result = await generate("opp-1");
      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.inserted).toBe(0);
    });

    it("returns zeros when AI returns empty", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "T", description: "d", frequency: 3, severity: "0.7", buying_intent: "0.7",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "s-1", overall_score: "85" });
      mocks.mockProvider.generateVentureReport.mockResolvedValue([]);

      const result = await generate("opp-1");
      expect(result.processed).toBe(1);
      expect(result.generated).toBe(0);
      expect(result.inserted).toBe(0);
    });

    it("returns skipped when report already exists (idempotent)", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "T", description: "d", frequency: 3, severity: "0.7", buying_intent: "0.7",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "s-1", overall_score: "85" });
      mocks.mockProvider.generateVentureReport.mockResolvedValue([makeReport()]);
      mocks.reportsRepo.findByOpportunity.mockResolvedValue({ id: "report-existing" });

      const result = await generate("opp-1");
      expect(result.generated).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.inserted).toBe(0);
      expect(mocks.reportsRepo.create).not.toHaveBeenCalled();
    });

    it("inserts report and triggers alert when recommendation == STRONG BUY", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Hot", description: "very hot", frequency: 8, severity: "0.95", buying_intent: "0.95",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "s-1", overall_score: "92" });
      mocks.mockProvider.generateVentureReport.mockResolvedValue([makeReport({ recommendation: "STRONG BUY", confidence: 92 })]);
      mocks.reportsRepo.findByOpportunity.mockResolvedValue(null);
      mocks.reportsRepo.create.mockResolvedValue({ id: "report-1" });
      mocks.matchingService.matchOpportunityToWatchlists.mockResolvedValue([
        { userId: "user-1", watchlistId: "wl-1" },
      ]);
      mocks.alertsRepo.findByWatchlistAndOpportunity.mockResolvedValue(null);
      mocks.alertsRepo.create.mockResolvedValue({ id: "alert-1" });
      mocks.emailService.queueAlertEmail.mockResolvedValue("notif-1");

      const result = await generate("opp-1");
      expect(result.processed).toBe(1);
      expect(result.inserted).toBe(1);

      expect(mocks.reportsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          opportunity_id: "opp-1",
          startup_score_id: "s-1",
          recommendation: "STRONG BUY",
          confidence: 92,
          report_version: 1,
        }),
      );
      expect(mocks.alertsRepo.create).toHaveBeenCalledWith({
        user_id: "user-1",
        watchlist_id: "wl-1",
        opportunity_id: "opp-1",
      });
      expect(mocks.emailService.queueAlertEmail).toHaveBeenCalledWith("user-1", "alert-1");
    });

    it("does NOT trigger alert when recommendation is BUY", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Mid", description: "mid", frequency: 3, severity: "0.6", buying_intent: "0.6",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "s-1", overall_score: "82" });
      mocks.mockProvider.generateVentureReport.mockResolvedValue([makeReport({ recommendation: "BUY", confidence: 75 })]);
      mocks.reportsRepo.findByOpportunity.mockResolvedValue(null);
      mocks.reportsRepo.create.mockResolvedValue({ id: "report-1" });

      const result = await generate("opp-1");
      expect(result.inserted).toBe(1);
      expect(mocks.alertsRepo.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // generateBatch()
  // ---------------------------------------------------------------------------
  describe("generateBatch()", () => {
    it("returns zeros when no score cards", async () => {
      mocks.scoresRepo.listCards.mockResolvedValue([]);
      const result = await generateBatch(50);
      expect(result.processed).toBe(0);
    });

    it("skips opportunities that are missing", async () => {
      mocks.scoresRepo.listCards.mockResolvedValue([
        { opportunity_id: "opp-1", overall_score: 85 },
      ]);
      mocks.opportunityRepo.findByIds.mockResolvedValue([null]);
      mocks.mockProvider.generateVentureReport.mockResolvedValue([]);

      const result = await generateBatch(50);
      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it("generates reports for eligible opportunities", async () => {
      mocks.scoresRepo.listCards.mockResolvedValue([
        { opportunity_id: "opp-1", overall_score: 85 },
      ]);
      mocks.opportunityRepo.findByIds.mockResolvedValue([
        { id: "opp-1", title: "A", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.8" },
      ]);
      mocks.mockProvider.generateVentureReport.mockResolvedValue([makeReport({ recommendation: "BUY" })]);
      mocks.reportsRepo.findByOpportunity.mockResolvedValue(null);
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "s-1" });
      mocks.reportsRepo.create.mockResolvedValue({ id: "report-1" });

      const result = await generateBatch(50);
      expect(result.processed).toBe(1);
      expect(result.inserted).toBe(1);
    });

    it("respects limit parameter", async () => {
      mocks.scoresRepo.listCards.mockResolvedValue([]);
      await generateBatch(25);
      expect(mocks.scoresRepo.listCards).toHaveBeenCalledWith({ limit: 25, minScore: VENTURE_REPORT_SCORE_THRESHOLD });
    });
  });

  // ---------------------------------------------------------------------------
  // getTopReports
  // ---------------------------------------------------------------------------
  describe("getTopReports()", () => {
    it("returns top reports from repository", async () => {
      mocks.reportsRepo.listCards.mockResolvedValue([
        { id: "r-1", opportunity_id: "opp-1", recommendation: "STRONG BUY", confidence: 92 },
      ]);
      const result = await getTopReports(10);
      expect(result).toHaveLength(1);
      expect(mocks.reportsRepo.listCards).toHaveBeenCalledWith({ limit: 10 });
    });
  });

  // ---------------------------------------------------------------------------
  // getStatistics
  // ---------------------------------------------------------------------------
  describe("getStatistics()", () => {
    it("returns stats from repository", async () => {
      mocks.reportsRepo.getStats.mockResolvedValue({
        total: 7,
        averageConfidence: 82,
        investmentGradeCount: 3,
        strongBuyCount: 1,
        latestReportDate: "2026-06-30T00:00:00Z",
      });
      const result = await getStatistics();
      expect(result.total).toBe(7);
      expect(result.averageConfidence).toBe(82);
      expect(result.investmentGradeCount).toBe(3);
      expect(result.strongBuyCount).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getOpportunityReport
  // ---------------------------------------------------------------------------
  describe("getOpportunityReport()", () => {
    it("returns report for an opportunity", async () => {
      mocks.reportsRepo.findByOpportunity.mockResolvedValue({ id: "r-1", opportunity_id: "opp-1" });
      const result = await getOpportunityReport("opp-1");
      expect(result).toEqual({ id: "r-1", opportunity_id: "opp-1" });
    });

    it("returns null when no report", async () => {
      mocks.reportsRepo.findByOpportunity.mockResolvedValue(null);
      const result = await getOpportunityReport("opp-x");
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getInvestmentGradeCount
  // ---------------------------------------------------------------------------
  describe("getInvestmentGradeCount()", () => {
    it("returns count from repository", async () => {
      mocks.reportsRepo.investmentGradeCount.mockResolvedValue(3);
      const result = await getInvestmentGradeCount();
      expect(result).toBe(3);
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeReport(overrides: Partial<{
  title: string;
  executive_summary: string;
  problem: string;
  market_analysis: string;
  tam_analysis: string;
  competition_analysis: string;
  customer_segments: string;
  business_model: string;
  pricing_strategy: string;
  go_to_market: string;
  distribution_strategy: string;
  product_roadmap: string;
  technical_risks: string;
  business_risks: string;
  competitive_advantages: string;
  moat_analysis: string;
  financial_outlook: string;
  recommendation: string;
  confidence: number;
}> = {}) {
  return {
    title: overrides.title ?? "Test Report",
    executive_summary: overrides.executive_summary ?? "Test summary",
    problem: overrides.problem ?? "Problem statement",
    market_analysis: overrides.market_analysis ?? "Market analysis",
    tam_analysis: overrides.tam_analysis ?? "TAM analysis",
    competition_analysis: overrides.competition_analysis ?? "Competition analysis",
    customer_segments: overrides.customer_segments ?? "Customer segments",
    business_model: overrides.business_model ?? "Business model",
    pricing_strategy: overrides.pricing_strategy ?? "Pricing strategy",
    go_to_market: overrides.go_to_market ?? "GTM strategy",
    distribution_strategy: overrides.distribution_strategy ?? "Distribution",
    product_roadmap: overrides.product_roadmap ?? "Roadmap",
    technical_risks: overrides.technical_risks ?? "Technical risks",
    business_risks: overrides.business_risks ?? "Business risks",
    competitive_advantages: overrides.competitive_advantages ?? "Advantages",
    moat_analysis: overrides.moat_analysis ?? "Moat",
    financial_outlook: overrides.financial_outlook ?? "Financial outlook",
    recommendation: overrides.recommendation ?? "BUY",
    confidence: overrides.confidence ?? 80,
  };
}