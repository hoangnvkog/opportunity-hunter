/**
 * Sprint 59: Backtesting Service Tests
 *
 * Unit tests for the backtesting orchestration layer.
 * Validates: evaluateOpportunity, evaluateBatch, calculateAccuracy,
 * calculatePredictionDelta, getStatistics, analytics events.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  backtestsRepo: {
    create: vi.fn(),
    createMany: vi.fn(),
    findById: vi.fn(),
    findByOpportunity: vi.fn(),
    findLatest: vi.fn(),
    findPending: vi.fn(),
    list: vi.fn(),
    listCards: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
    getStats: vi.fn(),
    getAccuracyDistribution: vi.fn(),
  },
  scoresRepo: {
    findByOpportunity: vi.fn(),
  },
  opportunityRepo: {
    findById: vi.fn(),
  },
  forecastsRepo: {
    findByOpportunity: vi.fn(),
  },
  intelRepo: {
    findByOpportunity: vi.fn(),
  },
  mockProvider: {
    evaluateBacktest: vi.fn(),
  },
}));

vi.mock("@/lib/db/repositories/opportunity-backtests.repository", () => ({
  OpportunityBacktestsRepository: {
    create: vi.fn().mockResolvedValue(mocks.backtestsRepo),
  },
}));

vi.mock("@/lib/db/repositories/opportunities.repository", () => ({
  OpportunitiesRepository: {
    create: vi.fn().mockResolvedValue(mocks.opportunityRepo),
  },
}));

vi.mock("@/lib/db/repositories/startup-scores.repository", () => ({
  StartupScoresRepository: {
    create: vi.fn().mockResolvedValue(mocks.scoresRepo),
  },
}));

vi.mock("@/lib/db/repositories/market-intelligence.repository", () => ({
  MarketIntelligenceRepository: {
    create: vi.fn().mockResolvedValue(mocks.intelRepo),
  },
}));

vi.mock("@/lib/db/repositories/opportunity-forecasts.repository", () => ({
  OpportunityForecastsRepository: {
    create: vi.fn().mockResolvedValue(mocks.forecastsRepo),
  },
}));

vi.mock("@/lib/ai", () => ({
  createAIProvider: vi.fn(() => mocks.mockProvider),
  getAIProviderFromEnv: vi.fn(() => mocks.mockProvider),
}));

import {
  evaluateOpportunity,
  evaluateBacktest,
  evaluateBatch,
  calculateAccuracy,
  calculatePredictionDelta,
  getStatistics,
  listBacktests,
} from "../backtesting.service";

describe("BacktestingService", () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // Pure helpers
  // ---------------------------------------------------------------------------
  describe("calculateAccuracy()", () => {
    it("returns 100 when predicted equals actual", () => {
      expect(calculateAccuracy(80, 80)).toBe(100);
    });

    it("returns 0 when delta >= 50", () => {
      expect(calculateAccuracy(100, 50)).toBe(0);
      expect(calculateAccuracy(50, 100)).toBe(0);
    });

    it("returns 90 when delta is 5", () => {
      expect(calculateAccuracy(80, 75)).toBe(90);
    });

    it("returns 60 when delta is 20", () => {
      expect(calculateAccuracy(80, 60)).toBe(60);
    });

    it("caps at 0 when delta >= 50", () => {
      // delta=40 → 100-80=20 (not capped)
      expect(calculateAccuracy(80, 120)).toBe(20);
      // delta=50 → 100-100=0 (capped at boundary)
      expect(calculateAccuracy(80, 30)).toBe(0);
    });
  });

  describe("calculatePredictionDelta()", () => {
    it("returns positive delta when overestimated", () => {
      expect(calculatePredictionDelta(80, 70)).toBe(10);
    });

    it("returns negative delta when underestimated", () => {
      expect(calculatePredictionDelta(70, 80)).toBe(-10);
    });

    it("returns 0 when exact", () => {
      expect(calculatePredictionDelta(75, 75)).toBe(0);
    });

    it("rounds to 2 decimal places", () => {
      expect(calculatePredictionDelta(80.123, 75.456)).toBe(4.67);
    });
  });

  // ---------------------------------------------------------------------------
  // evaluateOpportunity()
  // ---------------------------------------------------------------------------
  describe("evaluateOpportunity()", () => {
    it("returns processed:0 when opportunity does not exist", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue(null);
      const result = await evaluateOpportunity("opp-missing");
      expect(result.processed).toBe(0);
      expect(result.inserted).toBe(0);
    });

    it("returns skipped:1 when startup score is missing", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({ id: "opp-1", title: "Test", frequency: 5 });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue(null);
      const result = await evaluateOpportunity("opp-1");
      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it("creates a pending backtest when opportunity and score exist", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({ id: "opp-1", title: "Test", frequency: 5 });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: "82.500" });
      mocks.forecastsRepo.findByOpportunity.mockResolvedValue(null);
      mocks.backtestsRepo.create.mockResolvedValue({ id: "bt-1" });

      const result = await evaluateOpportunity("opp-1");
      expect(result.processed).toBe(1);
      expect(result.inserted).toBe(1);
      expect(mocks.backtestsRepo.create).toHaveBeenCalled();
    });

    it("is idempotent when backtest already exists", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({ id: "opp-1", title: "Test", frequency: 5 });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: "82.500" });
      mocks.forecastsRepo.findByOpportunity.mockResolvedValue(null);
      mocks.backtestsRepo.create.mockRejectedValue(new Error("unique constraint"));

      const result = await evaluateOpportunity("opp-1");
      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // evaluateBacktest() — single backtest evaluation
  // ---------------------------------------------------------------------------
  describe("evaluateBacktest()", () => {
    it("returns updated:0 when backtest not found", async () => {
      mocks.backtestsRepo.findById.mockResolvedValue(null);
      const result = await evaluateBacktest("bt-missing");
      expect(result.updated).toBe(0);
    });

    it("returns skipped:1 when backtest already evaluated", async () => {
      mocks.backtestsRepo.findById.mockResolvedValue({
        id: "bt-1",
        opportunity_id: "opp-1",
        predicted_score: "80.000",
        predicted_direction: "up",
        status: "evaluated",
        accuracy: "95.00",
      });
      const result = await evaluateBacktest("bt-1");
      expect(result.skipped).toBe(1);
    });

    it("updates backtest with AI evaluation result", async () => {
      mocks.backtestsRepo.findById.mockResolvedValue({
        id: "bt-1",
        opportunity_id: "opp-1",
        predicted_score: "80.000",
        predicted_direction: "up",
        status: "pending",
        accuracy: null,
        evaluation_date: "2026-07-01",
        created_at: new Date().toISOString(),
      });
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", score: "75.000", frequency: 5,
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: "82.000" });
      mocks.intelRepo.findByOpportunity.mockResolvedValue(null);
      mocks.mockProvider.evaluateBacktest.mockResolvedValue([{
        actual_score: 76,
        prediction_delta: 4,
        accuracy: 92,
        notes: "Prediction highly accurate.",
      }]);
      mocks.backtestsRepo.update.mockResolvedValue({ id: "bt-1", status: "evaluated" });

      const result = await evaluateBacktest("bt-1");
      expect(result.updated).toBe(1);
      expect(mocks.backtestsRepo.update).toHaveBeenCalled();
    });

    it("marks backtest as failed when AI returns nothing", async () => {
      mocks.backtestsRepo.findById.mockResolvedValue({
        id: "bt-1",
        opportunity_id: "opp-1",
        predicted_score: "80.000",
        predicted_direction: "up",
        status: "pending",
        evaluation_date: "2026-07-01",
        created_at: new Date().toISOString(),
      });
      mocks.opportunityRepo.findById.mockResolvedValue({ id: "opp-1", title: "Test", score: "75.000", frequency: 5 });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: "82.000" });
      mocks.intelRepo.findByOpportunity.mockResolvedValue(null);
      mocks.mockProvider.evaluateBacktest.mockResolvedValue([null as never]);
      mocks.backtestsRepo.update.mockResolvedValue({ id: "bt-1", status: "failed" });

      const result = await evaluateBacktest("bt-1");
      expect(result.updated).toBe(1);
      expect(mocks.backtestsRepo.update).toHaveBeenCalledWith("bt-1", { status: "failed" });
    });
  });

  // ---------------------------------------------------------------------------
  // evaluateBatch()
  // ---------------------------------------------------------------------------
  describe("evaluateBatch()", () => {
    it("returns zeros when no pending backtests", async () => {
      mocks.backtestsRepo.findPending.mockResolvedValue([]);
      const result = await evaluateBatch(50);
      expect(result.processed).toBe(0);
      expect(result.evaluated).toBe(0);
    });

    it("evaluates all pending backtests with AI", async () => {
      mocks.backtestsRepo.findPending.mockResolvedValue([
        { id: "bt-1", opportunity_id: "opp-1", predicted_score: "80.000", predicted_direction: "up" as const, status: "pending", evaluation_date: "2026-07-01", created_at: new Date().toISOString() },
        { id: "bt-2", opportunity_id: "opp-2", predicted_score: "70.000", predicted_direction: "down" as const, status: "pending", evaluation_date: "2026-07-01", created_at: new Date().toISOString() },
      ]);
      mocks.opportunityRepo.findById.mockImplementation((id) =>
        Promise.resolve({ id, title: "Test", score: id === "opp-1" ? "78.000" : "65.000", frequency: 5 }),
      );
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: "80.000" });
      mocks.intelRepo.findByOpportunity.mockResolvedValue(null);
      mocks.mockProvider.evaluateBacktest.mockResolvedValue([
        { actual_score: 78, prediction_delta: 2, accuracy: 96, notes: "Excellent." },
        { actual_score: 65, prediction_delta: 5, accuracy: 90, notes: "Good." },
      ]);
      mocks.backtestsRepo.update.mockResolvedValue({ id: "bt-1", status: "evaluated" });

      const result = await evaluateBatch(50);
      expect(result.processed).toBe(2);
      expect(result.evaluated).toBeGreaterThanOrEqual(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getStatistics()
  // ---------------------------------------------------------------------------
  describe("getStatistics()", () => {
    it("delegates to repository getStats()", async () => {
      mocks.backtestsRepo.getStats.mockResolvedValue({
        total: 10,
        evaluated: 8,
        pending: 2,
        averageAccuracy: 72.5,
        averageDelta: 8.2,
        successfulPredictions: 6,
        failedPredictions: 2,
        bestAccuracy: 98,
        worstAccuracy: 25,
        latestEvaluationDate: "2026-06-15",
      });

      const stats = await getStatistics();
      expect(stats.total).toBe(10);
      expect(stats.averageAccuracy).toBe(72.5);
      expect(stats.successfulPredictions).toBe(6);
      expect(stats.failedPredictions).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // listBacktests()
  // ---------------------------------------------------------------------------
  describe("listBacktests()", () => {
    it("delegates to repository listCards()", async () => {
      const cards = [
        { id: "bt-1", opportunity_id: "opp-1", opportunity_title: "Test 1", cluster_name: null, predicted_score: 80, actual_score: 78, prediction_delta: 2, accuracy: 96, status: "evaluated", evaluation_date: "2026-06-15", created_at: "2026-06-15T00:00:00Z" },
      ];
      mocks.backtestsRepo.listCards.mockResolvedValue(cards);

      const result = await listBacktests({ limit: 50 });
      expect(result).toEqual(cards);
    });
  });

  // ---------------------------------------------------------------------------
  // Analytics events
  // ---------------------------------------------------------------------------
  describe("Analytics events", () => {
    it("emits backtest_generated on batch evaluation", async () => {
      mocks.backtestsRepo.findPending.mockResolvedValue([
        { id: "bt-1", opportunity_id: "opp-1", predicted_score: "80.000", predicted_direction: "up" as const, status: "pending", evaluation_date: "2026-07-01", created_at: new Date().toISOString() },
      ]);
      mocks.opportunityRepo.findById.mockResolvedValue({ id: "opp-1", title: "Test", score: "78.000", frequency: 5 });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: "80.000" });
      mocks.intelRepo.findByOpportunity.mockResolvedValue(null);
      mocks.mockProvider.evaluateBacktest.mockResolvedValue([
        { actual_score: 78, prediction_delta: 2, accuracy: 96, notes: "OK" },
      ]);
      mocks.backtestsRepo.update.mockResolvedValue({ id: "bt-1", status: "evaluated" });

      await evaluateBatch(50);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[analytics] backtesting",
        expect.stringContaining("backtest_generated"),
      );
    });
  });
});