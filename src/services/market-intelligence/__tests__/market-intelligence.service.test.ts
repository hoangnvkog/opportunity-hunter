/**
 * Sprint 55: Market Intelligence Service Tests
 *
 * Unit tests for the market-intelligence orchestration layer.
 * Validates: eligibility gates (validation >= 70 AND forecast >= 70),
 * batch processing, alert triggering at threshold, analytics emission.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Hoisted mocks — these are module-level replacements the service uses.
const mocks = vi.hoisted(() => ({
  intelligenceRepo: {
    create: vi.fn(),
    createMany: vi.fn(),
    deleteByOpportunity: vi.fn(),
    findByOpportunity: vi.fn(),
    list: vi.fn(),
    listTop: vi.fn(),
    listCards: vi.fn(),
    count: vi.fn(),
    averageScore: vi.fn(),
    averageConfidence: vi.fn(),
    topScore: vi.fn(),
    mostDiscussedOpportunityId: vi.fn(),
    getStats: vi.fn(),
    getSignalDistribution: vi.fn(),
    getHistory: vi.fn(),
    getConfidenceHistory: vi.fn(),
  },
  validationRepo: {
    findByOpportunityId: vi.fn(),
    list: vi.fn(),
  },
  forecastRepo: {
    findByOpportunity: vi.fn(),
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
    generateMarketIntelligence: vi.fn(),
  },
}));

vi.mock("@/lib/db/repositories/market-intelligence.repository", () => ({
  MarketIntelligenceRepository: {
    create: vi.fn().mockResolvedValue(mocks.intelligenceRepo),
  },
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

vi.mock("@/lib/supabase", () => ({
  getSupabaseServiceClient: vi.fn().mockReturnValue({}),
  getSupabaseServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/ai", () => ({
  createAIProvider: vi.fn(() => mocks.mockProvider),
  getAIProviderFromEnv: vi.fn(() => mocks.mockProvider),
}));

import {
  generate,
  generateBatch,
  getTopSignals,
  getStats,
  MASSIVE_SIGNAL_THRESHOLD,
} from "../market-intelligence.service";

describe("MarketIntelligenceService", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
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
      expect(result).toEqual({
        processed: 0,
        generated: 0,
        skipped: 0,
        inserted: 0,
      });
    });

    it("returns skipped when validation is missing", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1",
        title: "Test",
        description: "desc",
        frequency: 5,
        severity: "0.8",
        buying_intent: "0.7",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue(null);
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({
        id: "fc-1",
        opportunity_id: "opp-1",
        forecast_score: 80,
        confidence: 75,
      });
      const result = await generate("opp-1");
      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it("returns skipped when forecast is missing", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1",
        title: "Test",
        description: "desc",
        frequency: 5,
        severity: "0.8",
        buying_intent: "0.7",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({
        id: "v-1",
        opportunity_id: "opp-1",
        validation_score: "85",
      });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue(null);
      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
    });

    it("returns skipped when validation_score < 70", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1",
        title: "Test",
        description: "desc",
        frequency: 5,
        severity: "0.5",
        buying_intent: "0.5",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({
        id: "v-1",
        opportunity_id: "opp-1",
        validation_score: "55",
      });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({
        id: "fc-1",
        opportunity_id: "opp-1",
        forecast_score: 80,
      });
      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
      expect(result.inserted).toBe(0);
    });

    it("returns skipped when forecast_score < 70", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1",
        title: "Test",
        description: "desc",
        frequency: 5,
        severity: "0.5",
        buying_intent: "0.5",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({
        id: "v-1",
        opportunity_id: "opp-1",
        validation_score: "85",
      });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({
        id: "fc-1",
        opportunity_id: "opp-1",
        forecast_score: 60,
      });
      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
    });

    it("inserts intelligence and triggers massive signal alert when overall > 90", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1",
        title: "Hot opportunity",
        description: "very hot",
        frequency: 5,
        severity: "0.95",
        buying_intent: "0.95",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({
        id: "v-1",
        opportunity_id: "opp-1",
        validation_score: "90",
      });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({
        id: "fc-1",
        opportunity_id: "opp-1",
        forecast_score: 92,
      });
      mocks.mockProvider.generateMarketIntelligence.mockResolvedValue([
        {
          reddit_score: 95,
          github_score: 90,
          product_hunt_score: 92,
          news_score: 88,
          google_trends_score: 96,
          jobs_score: 94,
          overall_score: 92.5,
          confidence: 90,
          summary: "Massive market signal",
        },
      ]);
      mocks.intelligenceRepo.create.mockResolvedValue({ id: "intel-1" });
      mocks.matchingService.matchOpportunityToWatchlists.mockResolvedValue([
        { userId: "user-1", watchlistId: "wl-1" },
      ]);
      mocks.alertsRepo.findByWatchlistAndOpportunity.mockResolvedValue(null);
      mocks.alertsRepo.create.mockResolvedValue({ id: "alert-1" });
      mocks.emailService.queueAlertEmail.mockResolvedValue("notif-1");

      const result = await generate("opp-1");
      expect(result.processed).toBe(1);
      expect(result.inserted).toBe(1);

      expect(mocks.intelligenceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          opportunity_id: "opp-1",
          overall_score: 92.5,
          confidence: 90,
        }),
      );
      expect(mocks.alertsRepo.create).toHaveBeenCalledWith({
        user_id: "user-1",
        watchlist_id: "wl-1",
        opportunity_id: "opp-1",
      });
      expect(mocks.emailService.queueAlertEmail).toHaveBeenCalledWith(
        "user-1",
        "alert-1",
      );
    });

    it("does NOT trigger alert when overall_score <= 90", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1",
        title: "Mid opportunity",
        description: "mid",
        frequency: 3,
        severity: "0.6",
        buying_intent: "0.6",
      });
      mocks.validationRepo.findByOpportunityId.mockResolvedValue({
        id: "v-1",
        opportunity_id: "opp-1",
        validation_score: "80",
      });
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({
        id: "fc-1",
        opportunity_id: "opp-1",
        forecast_score: 75,
      });
      mocks.mockProvider.generateMarketIntelligence.mockResolvedValue([
        {
          reddit_score: 60,
          github_score: 55,
          product_hunt_score: 50,
          news_score: 45,
          google_trends_score: 65,
          jobs_score: 40,
          overall_score: 52.5,
          confidence: 70,
          summary: "Moderate signals",
        },
      ]);
      mocks.intelligenceRepo.create.mockResolvedValue({ id: "intel-1" });

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
    it("returns zeros when no validations", async () => {
      mocks.validationRepo.list.mockResolvedValue([]);
      const result = await generateBatch(50);
      expect(result.processed).toBe(0);
    });

    it("skips opportunities without forecast_score >= 70", async () => {
      mocks.validationRepo.list.mockResolvedValue([
        { opportunity_id: "opp-1", validation_score: "85" },
      ]);
      mocks.opportunityRepo.findByIds.mockResolvedValue([
        {
          id: "opp-1",
          title: "A",
          description: "desc",
          frequency: 5,
          severity: "0.8",
          buying_intent: "0.8",
        },
      ]);
      mocks.forecastRepo.findByOpportunity.mockResolvedValue({
        id: "fc-1",
        opportunity_id: "opp-1",
        forecast_score: 60, // below threshold
      });

      const result = await generateBatch(50);
      expect(result.processed).toBe(1);
      expect(result.generated).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it("processes eligible opportunities in batch", async () => {
      mocks.validationRepo.list.mockResolvedValue([
        { opportunity_id: "opp-1", validation_score: "85" },
        { opportunity_id: "opp-2", validation_score: "90" },
      ]);
      mocks.opportunityRepo.findByIds.mockResolvedValue([
        {
          id: "opp-1",
          title: "A",
          description: "desc",
          frequency: 5,
          severity: "0.8",
          buying_intent: "0.8",
        },
        {
          id: "opp-2",
          title: "B",
          description: "desc2",
          frequency: 6,
          severity: "0.85",
          buying_intent: "0.85",
        },
      ]);
      mocks.forecastRepo.findByOpportunity.mockImplementation(async (id: string) => ({
        id: `fc-${id}`,
        opportunity_id: id,
        forecast_score: 80,
      }));
      mocks.mockProvider.generateMarketIntelligence.mockResolvedValue([
        {
          reddit_score: 70,
          github_score: 65,
          product_hunt_score: 60,
          news_score: 55,
          google_trends_score: 75,
          jobs_score: 50,
          overall_score: 62.5,
          confidence: 80,
          summary: "ok",
        },
        {
          reddit_score: 80,
          github_score: 75,
          product_hunt_score: 70,
          news_score: 65,
          google_trends_score: 85,
          jobs_score: 60,
          overall_score: 72.5,
          confidence: 85,
          summary: "good",
        },
      ]);
      mocks.intelligenceRepo.create.mockResolvedValue({ id: "intel-x" });

      const result = await generateBatch(50);
      expect(result.processed).toBe(2);
      expect(result.inserted).toBe(2);
      expect(mocks.intelligenceRepo.deleteByOpportunity).toHaveBeenCalledTimes(2);
      expect(mocks.intelligenceRepo.create).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getTopSignals() / getStats()
  // ---------------------------------------------------------------------------

  describe("getTopSignals()", () => {
    it("delegates to repository.listCards", async () => {
      mocks.intelligenceRepo.listCards.mockResolvedValue([
        { id: "i-1", opportunity_id: "opp-1", overall_score: 95 },
      ]);
      const result = await getTopSignals(10);
      expect(mocks.intelligenceRepo.listCards).toHaveBeenCalledWith({ limit: 10 });
      expect(result).toHaveLength(1);
    });
  });

  describe("getStats()", () => {
    it("maps repository.getStats into service stats shape", async () => {
      mocks.intelligenceRepo.getStats.mockResolvedValue({
        total: 5,
        averageOverallScore: 70,
        highestOverallScore: 95,
        averageConfidence: 80,
        averageRedditScore: 60,
        averageGithubScore: 65,
        averageProductHuntScore: 70,
        averageNewsScore: 55,
        averageGoogleTrendsScore: 75,
        averageJobsScore: 50,
      });
      const result = await getStats();
      expect(result.total).toBe(5);
      expect(result.highestOverallScore).toBe(95);
      expect(result.averageOverallScore).toBe(70);
    });
  });

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  it("MASSIVE_SIGNAL_THRESHOLD is 90", () => {
    expect(MASSIVE_SIGNAL_THRESHOLD).toBe(90);
  });
});