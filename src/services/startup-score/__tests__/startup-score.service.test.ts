/**
 * Sprint 56: Startup Score Service Tests
 *
 * Unit tests for the startup-score orchestration layer.
 * Validates: 3-gate eligibility (validation >= 70 AND forecast >= 70 AND intelligence >= 70),
 * batch processing, alert triggering at threshold, analytics emission.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  scoresRepo: {
    create: vi.fn(),
    createMany: vi.fn(),
    deleteByOpportunity: vi.fn(),
    findByOpportunity: vi.fn(),
    list: vi.fn(),
    listTop: vi.fn(),
    listCards: vi.fn(),
    count: vi.fn(),
    averageScore: vi.fn(),
    topScore: vi.fn(),
    investmentGradeCount: vi.fn(),
    getStats: vi.fn(),
  },
  validationRepo: {
    findByOpportunityId: vi.fn(),
    list: vi.fn(),
  },
  forecastRepo: {
    findByOpportunity: vi.fn(),
  },
  intelligenceRepo: {
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
    scoreStartupPotential: vi.fn(),
  },
}));

vi.mock("@/lib/db/repositories/startup-scores.repository", () => ({
  StartupScoresRepository: {
    create: vi.fn().mockResolvedValue(mocks.scoresRepo),
  },
  INVESTMENT_GRADE_THRESHOLD: 90,
}));

vi.mock("@/lib/db/repositories/opportunity-validations.repository", () => ({
  OpportunityValidationsRepository: {
    create: vi.fn().mockResolvedValue(mocks.validationRepo),
  },
}));

vi.mock("@/lib/db/repositories/opportunity-forecasts.repository", () => ({
  OpportunityForecastsRepository: {
    create: vi.fn().mockResolvedValue(mocks.forecastRepo),
  },
}));

vi.mock("@/lib/db/repositories/market-intelligence.repository", () => ({
  MarketIntelligenceRepository: {
    create: vi.fn().mockResolvedValue(mocks.intelligenceRepo),
  },
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
  getTopScores,
  getStatistics,
  getOpportunityScore,
  INVESTMENT_GRADE_ALERT_THRESHOLD,
} from "../startup-score.service";

describe("StartupScoreService", () => {
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

    it("returns skipped when validation is missing", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.7",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue(null);
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ id: "fc-1" });
      mocks.intelligenceRepo.findByOpportunity.mockResolvedValue({ id: "i-1", overall_score: 80 });

      const result = await generate("opp-1");
      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it("returns skipped when forecast is missing", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.7",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ id: "v-1", validation_score: "85" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue(null);
      mocks.intelligenceRepo.findByOpportunity.mockResolvedValue({ id: "i-1", overall_score: 80 });

      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
    });

    it("returns skipped when intelligence is missing", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.7",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ id: "v-1", validation_score: "85" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ id: "fc-1", forecast_score: 80 });
      mocks.intelligenceRepo.findByOpportunity.mockResolvedValue(null);

      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
    });

    it("returns skipped when validation_score < 70", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.5", buying_intent: "0.5",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ id: "v-1", validation_score: "55" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ id: "fc-1", forecast_score: 80 });
      mocks.intelligenceRepo.findByOpportunity.mockResolvedValue({ id: "i-1", overall_score: 80 });

      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
      expect(result.inserted).toBe(0);
    });

    it("returns skipped when forecast_score < 70", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.5", buying_intent: "0.5",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ id: "v-1", validation_score: "85" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ id: "fc-1", forecast_score: 60 });
      mocks.intelligenceRepo.findByOpportunity.mockResolvedValue({ id: "i-1", overall_score: 80 });

      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
    });

    it("returns skipped when intelligence overall_score < 70", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.5", buying_intent: "0.5",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ id: "v-1", validation_score: "85" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ id: "fc-1", forecast_score: 80 });
      mocks.intelligenceRepo.findByOpportunity.mockResolvedValue({ id: "i-1", overall_score: 55 });

      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
    });

    it("inserts score and triggers alert when overall_score >= 90", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Hot opportunity", description: "very hot", frequency: 5, severity: "0.95", buying_intent: "0.95",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ id: "v-1", validation_score: "90" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ id: "fc-1", forecast_score: 92 });
      mocks.intelligenceRepo.findByOpportunity.mockResolvedValue({ id: "i-1", overall_score: 88 });

      mocks.mockProvider.scoreStartupPotential.mockResolvedValue([{
        tam_score: 92,
        market_timing_score: 88,
        competition_score: 85,
        moat_score: 90,
        distribution_score: 87,
        execution_score: 85,
        capital_efficiency_score: 91,
        overall_score: 95,
        confidence: 90,
        recommendation: "Strong Invest",
        summary: "Top tier opportunity",
      }]);

      mocks.scoresRepo.deleteByOpportunity.mockResolvedValue(0);
      mocks.scoresRepo.create.mockResolvedValue({ id: "score-1" });
      mocks.matchingService.matchOpportunityToWatchlists.mockResolvedValue([
        { userId: "user-1", watchlistId: "wl-1" },
      ]);
      mocks.alertsRepo.findByWatchlistAndOpportunity.mockResolvedValue(null);
      mocks.alertsRepo.create.mockResolvedValue({ id: "alert-1" });
      mocks.emailService.queueAlertEmail.mockResolvedValue("notif-1");

      const result = await generate("opp-1");
      expect(result.processed).toBe(1);
      expect(result.inserted).toBe(1);

      expect(mocks.scoresRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          opportunity_id: "opp-1",
          overall_score: 95,
          recommendation: "Strong Invest",
        }),
      );
      expect(mocks.alertsRepo.create).toHaveBeenCalledWith({
        user_id: "user-1",
        watchlist_id: "wl-1",
        opportunity_id: "opp-1",
      });
      expect(mocks.emailService.queueAlertEmail).toHaveBeenCalledWith("user-1", "alert-1");
    });

    it("does NOT trigger alert when overall_score < 90", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Mid", description: "mid", frequency: 3, severity: "0.6", buying_intent: "0.6",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ id: "v-1", validation_score: "80" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ id: "fc-1", forecast_score: 75 });
      mocks.intelligenceRepo.findByOpportunity.mockResolvedValue({ id: "i-1", overall_score: 72 });

      mocks.mockProvider.scoreStartupPotential.mockResolvedValue([{
        tam_score: 60,
        market_timing_score: 55,
        competition_score: 50,
        moat_score: 45,
        distribution_score: 55,
        execution_score: 60,
        capital_efficiency_score: 58,
        overall_score: 55,
        confidence: 70,
        recommendation: "Pass",
        summary: "Below threshold",
      }]);

      mocks.scoresRepo.deleteByOpportunity.mockResolvedValue(0);
      mocks.scoresRepo.create.mockResolvedValue({ id: "score-1" });

      const result = await generate("opp-1");
      expect(result.inserted).toBe(1);
      expect(mocks.alertsRepo.create).not.toHaveBeenCalled();
      expect(mocks.emailService.queueAlertEmail).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // generateBatch()
  // ---------------------------------------------------------------------------
  describe("generateBatch()", () => {
    it("returns zeros when no intelligence cards", async () => {
      mocks.intelligenceRepo.listCards.mockResolvedValue([]);
      const result = await generateBatch(50);
      expect(result.processed).toBe(0);
    });

    it("skips opportunities without validation >= 70", async () => {
      mocks.intelligenceRepo.listCards.mockResolvedValue([
        { opportunity_id: "opp-1", overall_score: 80 },
      ]);
      mocks.opportunityRepo.findByIds.mockResolvedValue([
        { id: "opp-1", title: "A", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.8" },
      ]);
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ validation_score: "55" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ forecast_score: 80 });

      const result = await generateBatch(50);
      expect(result.skipped).toBe(1);
      expect(result.inserted).toBe(0);
    });

    it("skips opportunities without forecast >= 70", async () => {
      mocks.intelligenceRepo.listCards.mockResolvedValue([
        { opportunity_id: "opp-1", overall_score: 80 },
      ]);
      mocks.opportunityRepo.findByIds.mockResolvedValue([
        { id: "opp-1", title: "A", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.8" },
      ]);
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ validation_score: "85" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ forecast_score: "60" });

      const result = await generateBatch(50);
      expect(result.skipped).toBe(1);
    });

    it("generates scores for eligible opportunities", async () => {
      mocks.intelligenceRepo.listCards.mockResolvedValue([
        { opportunity_id: "opp-1", overall_score: 80 },
      ]);
      mocks.opportunityRepo.findByIds.mockResolvedValue([
        { id: "opp-1", title: "A", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.8" },
      ]);
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ validation_score: "85" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ forecast_score: 80 });

      mocks.mockProvider.scoreStartupPotential.mockResolvedValue([{
        tam_score: 80,
        market_timing_score: 75,
        competition_score: 70,
        moat_score: 85,
        distribution_score: 72,
        execution_score: 78,
        capital_efficiency_score: 82,
        overall_score: 78,
        confidence: 85,
        recommendation: "Watch",
        summary: "Good opportunity",
      }]);

      mocks.scoresRepo.deleteByOpportunity.mockResolvedValue(0);
      mocks.scoresRepo.create.mockResolvedValue({ id: "score-1" });

      const result = await generateBatch(50);
      expect(result.processed).toBe(1);
      expect(result.inserted).toBe(1);
      expect(mocks.scoresRepo.create).toHaveBeenCalled();
    });

    it("does NOT trigger alert when batch score < 90", async () => {
      mocks.intelligenceRepo.listCards.mockResolvedValue([
        { opportunity_id: "opp-1", overall_score: 80 },
      ]);
      mocks.opportunityRepo.findByIds.mockResolvedValue([
        { id: "opp-1", title: "A", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.8" },
      ]);
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({ validation_score: "85" });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({ forecast_score: 80 });

      mocks.mockProvider.scoreStartupPotential.mockResolvedValue([{
        tam_score: 60,
        market_timing_score: 55,
        competition_score: 50,
        moat_score: 45,
        distribution_score: 55,
        execution_score: 60,
        capital_efficiency_score: 58,
        overall_score: 55,
        confidence: 70,
        recommendation: "Pass",
        summary: "Below threshold",
      }]);

      mocks.scoresRepo.deleteByOpportunity.mockResolvedValue(0);
      mocks.scoresRepo.create.mockResolvedValue({ id: "score-1" });

      const result = await generateBatch(50);
      expect(result.inserted).toBe(1);
      expect(mocks.alertsRepo.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getTopScores
  // ---------------------------------------------------------------------------
  describe("getTopScores()", () => {
    it("returns top scores from repository", async () => {
      mocks.scoresRepo.listCards.mockResolvedValue([
        { id: "s-1", opportunity_id: "opp-1", overall_score: 95 },
      ]);
      const result = await getTopScores(10);
      expect(result).toHaveLength(1);
      expect(mocks.scoresRepo.listCards).toHaveBeenCalledWith({ limit: 10 });
    });
  });

  // ---------------------------------------------------------------------------
  // getStatistics
  // ---------------------------------------------------------------------------
  describe("getStatistics()", () => {
    it("returns stats from repository", async () => {
      mocks.scoresRepo.getStats.mockResolvedValue({
        total: 5,
        averageOverallScore: 72,
        highestOverallScore: 95,
        investmentGradeCount: 1,
        averageConfidence: 80,
        averageTamScore: 70,
        averageMarketTimingScore: 68,
        averageCompetitionScore: 65,
        averageMoatScore: 62,
        averageDistributionScore: 71,
        averageExecutionScore: 67,
        averageCapitalEfficiencyScore: 75,
      });
      const result = await getStatistics();
      expect(result.total).toBe(5);
      expect(result.highestOverallScore).toBe(95);
      expect(result.investmentGradeCount).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getOpportunityScore
  // ---------------------------------------------------------------------------
  describe("getOpportunityScore()", () => {
    it("returns score for an opportunity", async () => {
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "s-1", overall_score: 80 });
      const result = await getOpportunityScore("opp-1");
      expect(result).toEqual({ id: "s-1", overall_score: 80 });
    });

    it("returns null when no score", async () => {
      mocks.scoresRepo.findByOpportunity.mockResolvedValue(null);
      const result = await getOpportunityScore("opp-x");
      expect(result).toBeNull();
    });
  });
});
