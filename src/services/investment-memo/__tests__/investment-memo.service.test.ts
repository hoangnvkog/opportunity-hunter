/**
 * Sprint 58: Investment Memo Service Tests
 *
 * Unit tests for the investment-memo orchestration layer.
 * Validates: 85-threshold gate, idempotent memo creation,
 * batch processing, alert triggering on STRONG BUY,
 * analytics event emission, search delegation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  memosRepo: {
    create: vi.fn(),
    createMany: vi.fn(),
    findByOpportunity: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    listCards: vi.fn(),
    count: vi.fn(),
    averageConfidence: vi.fn(),
    strongBuyCount: vi.fn(),
    latestMemoDate: vi.fn(),
    getStats: vi.fn(),
    search: vi.fn(),
    searchCount: vi.fn(),
  },
  scoresRepo: {
    findByOpportunity: vi.fn(),
    listCards: vi.fn(),
  },
  reportsRepo: {
    findByOpportunity: vi.fn(),
  },
  opportunityRepo: {
    findById: vi.fn(),
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
    generateInvestmentMemo: vi.fn(),
  },
}));

vi.mock("@/lib/db/repositories/investment-memos.repository", () => ({
  InvestmentMemosRepository: {
    create: vi.fn().mockResolvedValue(mocks.memosRepo),
  },
}));

vi.mock("@/lib/db/repositories/startup-scores.repository", () => ({
  StartupScoresRepository: {
    create: vi.fn().mockResolvedValue(mocks.scoresRepo),
  },
}));

vi.mock("@/lib/db/repositories/venture-reports.repository", () => ({
  VentureReportsRepository: {
    create: vi.fn().mockResolvedValue(mocks.reportsRepo),
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
  getTopMemos,
  getStatistics,
  getOpportunityMemo,
  getMemoById,
  getStrongBuyCount,
  searchMemos,
  searchMemosCount,
  trackMemoViewed,
  trackMemoExported,
  INVESTMENT_MEMO_SCORE_THRESHOLD,
} from "../investment-memo.service";

describe("InvestmentMemoService", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("exposes the score threshold constant (85)", () => {
    expect(INVESTMENT_MEMO_SCORE_THRESHOLD).toBe(85);
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

    it("returns skipped when score is missing", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.7",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue(null);

      const result = await generate("opp-1");
      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it("returns skipped when overall_score < 85", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.6", buying_intent: "0.5",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: 70 });

      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
      expect(result.inserted).toBe(0);
    });

    it("returns skipped when venture report is missing", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.95", buying_intent: "0.95",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: 92 });
      mocks.reportsRepo.findByOpportunity.mockResolvedValue(null);

      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
    });

    it("returns skipped when memo already exists (idempotent)", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Test", description: "desc", frequency: 5, severity: "0.95", buying_intent: "0.95",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: 92 });
      mocks.reportsRepo.findByOpportunity.mockResolvedValue({ id: "vr-1" });
      mocks.memosRepo.findByOpportunity.mockResolvedValue({ id: "m-1" });

      const result = await generate("opp-1");
      expect(result.skipped).toBe(1);
      expect(result.inserted).toBe(0);
    });

    it("inserts memo and triggers STRONG BUY alert when recommendation matches", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Hot opportunity", description: "very hot", frequency: 5, severity: "0.95", buying_intent: "0.95",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: 92 });
      mocks.reportsRepo.findByOpportunity.mockResolvedValue({ id: "vr-1" });
      mocks.memosRepo.findByOpportunity.mockResolvedValue(null);

      mocks.mockProvider.generateInvestmentMemo.mockResolvedValue([{
        title: "Investment Memo",
        thesis: "T",
        market: "M",
        problem: "P",
        solution: "S",
        business_model: "BM",
        traction: "TR",
        competition: "C",
        risks: "R",
        strengths: "ST",
        why_now: "WN",
        investment_decision: "INVEST — lead the round.",
        recommendation: "STRONG BUY",
        confidence: 90,
      }]);

      mocks.memosRepo.create.mockResolvedValue({ id: "m-1" });
      mocks.matchingService.matchOpportunityToWatchlists.mockResolvedValue([
        { userId: "user-1", watchlistId: "wl-1" },
      ]);
      mocks.alertsRepo.findByWatchlistAndOpportunity.mockResolvedValue(null);
      mocks.alertsRepo.create.mockResolvedValue({ id: "alert-1" });
      mocks.emailService.queueAlertEmail.mockResolvedValue("notif-1");

      const result = await generate("opp-1");
      expect(result.inserted).toBe(1);

      expect(mocks.memosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          opportunity_id: "opp-1",
          venture_report_id: "vr-1",
          investment_score_id: "sc-1",
          recommendation: "STRONG BUY",
          confidence: 90,
        }),
      );
      expect(mocks.alertsRepo.create).toHaveBeenCalledWith({
        user_id: "user-1",
        watchlist_id: "wl-1",
        opportunity_id: "opp-1",
      });
      expect(mocks.emailService.queueAlertEmail).toHaveBeenCalledWith("user-1", "alert-1");
    });

    it("does NOT trigger alert when recommendation is BUY (not STRONG BUY)", async () => {
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "Hot opportunity", description: "very hot", frequency: 5, severity: "0.95", buying_intent: "0.95",
      });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: 92 });
      mocks.reportsRepo.findByOpportunity.mockResolvedValue({ id: "vr-1" });
      mocks.memosRepo.findByOpportunity.mockResolvedValue(null);

      mocks.mockProvider.generateInvestmentMemo.mockResolvedValue([{
        title: "Investment Memo",
        thesis: "T", market: "M", problem: "P", solution: "S",
        business_model: "BM", traction: "TR", competition: "C",
        risks: "R", strengths: "ST", why_now: "WN",
        investment_decision: "INVEST — participate.",
        recommendation: "BUY",
        confidence: 75,
      }]);

      mocks.memosRepo.create.mockResolvedValue({ id: "m-1" });

      const result = await generate("opp-1");
      expect(result.inserted).toBe(1);
      expect(mocks.alertsRepo.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // generateBatch()
  // ---------------------------------------------------------------------------
  describe("generateBatch()", () => {
    it("returns zeros when no score cards at threshold", async () => {
      mocks.scoresRepo.listCards.mockResolvedValue([]);
      const result = await generateBatch(50);
      expect(result.processed).toBe(0);
    });

    it("skips opportunities without venture report", async () => {
      mocks.scoresRepo.listCards.mockResolvedValue([
        { opportunity_id: "opp-1", overall_score: 92 },
      ]);
      mocks.memosRepo.list.mockResolvedValue([]);
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "A", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.8",
      });
      mocks.reportsRepo.findByOpportunity.mockResolvedValue(null);

      const result = await generateBatch(50);
      expect(result.processed).toBe(1);
      expect(result.inserted).toBe(0);
    });

    it("skips opportunities that already have a memo (idempotent)", async () => {
      mocks.scoresRepo.listCards.mockResolvedValue([
        { opportunity_id: "opp-1", overall_score: 92 },
      ]);
      mocks.memosRepo.list.mockResolvedValue([
        { id: "m-existing", opportunity_id: "opp-1" },
      ] as never);

      const result = await generateBatch(50);
      expect(result.processed).toBe(1);
      expect(result.skipped).toBeGreaterThanOrEqual(1);
    });

    it("generates memos for eligible opportunities and tracks analytics", async () => {
      mocks.scoresRepo.listCards.mockResolvedValue([
        { opportunity_id: "opp-1", overall_score: 92 },
      ]);
      mocks.memosRepo.list.mockResolvedValue([]);
      mocks.opportunityRepo.findById.mockResolvedValue({
        id: "opp-1", title: "A", description: "desc", frequency: 5, severity: "0.8", buying_intent: "0.8",
      });
      mocks.reportsRepo.findByOpportunity.mockResolvedValue({ id: "vr-1" });
      mocks.scoresRepo.findByOpportunity.mockResolvedValue({ id: "sc-1", overall_score: 92 });
      mocks.memosRepo.findByOpportunity.mockResolvedValue(null);

      mocks.mockProvider.generateInvestmentMemo.mockResolvedValue([{
        title: "Memo",
        thesis: "T", market: "M", problem: "P", solution: "S",
        business_model: "BM", traction: "TR", competition: "C",
        risks: "R", strengths: "ST", why_now: "WN",
        investment_decision: "INVEST",
        recommendation: "STRONG BUY",
        confidence: 90,
      }]);

      mocks.memosRepo.create.mockResolvedValue({ id: "m-1" });
      mocks.matchingService.matchOpportunityToWatchlists.mockResolvedValue([]);

      const result = await generateBatch(50);
      expect(result.inserted).toBe(1);
      // emitAnalytics calls console.info(label, jsonString)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("investment_memo_generated"),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getTopMemos
  // ---------------------------------------------------------------------------
  describe("getTopMemos()", () => {
    it("returns top memos from repository", async () => {
      mocks.memosRepo.listCards.mockResolvedValue([
        { id: "m-1", opportunity_id: "opp-1", overall_score: 92, confidence: 88 },
      ] as never);
      const result = await getTopMemos(10);
      expect(result).toHaveLength(1);
      expect(mocks.memosRepo.listCards).toHaveBeenCalledWith({ limit: 10 });
    });
  });

  // ---------------------------------------------------------------------------
  // getStatistics
  // ---------------------------------------------------------------------------
  describe("getStatistics()", () => {
    it("returns stats from repository", async () => {
      mocks.memosRepo.getStats.mockResolvedValue({
        total: 4,
        averageConfidence: 82,
        strongBuyCount: 2,
        investorReadyCount: 2,
        latestMemoDate: "2026-06-29T00:00:00Z",
      });
      const result = await getStatistics();
      expect(result.total).toBe(4);
      expect(result.averageConfidence).toBe(82);
      expect(result.strongBuyCount).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getOpportunityMemo + getMemoById
  // ---------------------------------------------------------------------------
  describe("getOpportunityMemo() / getMemoById()", () => {
    it("getOpportunityMemo returns memo", async () => {
      mocks.memosRepo.findByOpportunity.mockResolvedValue({ id: "m-1" });
      const result = await getOpportunityMemo("opp-1");
      expect(result).toEqual({ id: "m-1" });
    });

    it("getOpportunityMemo returns null when missing", async () => {
      mocks.memosRepo.findByOpportunity.mockResolvedValue(null);
      expect(await getOpportunityMemo("opp-x")).toBeNull();
    });

    it("getMemoById returns memo by PK", async () => {
      mocks.memosRepo.findById.mockResolvedValue({ id: "m-1" });
      const result = await getMemoById("m-1");
      expect(result).toEqual({ id: "m-1" });
    });
  });

  // ---------------------------------------------------------------------------
  // getStrongBuyCount
  // ---------------------------------------------------------------------------
  describe("getStrongBuyCount()", () => {
    it("returns STRONG BUY count", async () => {
      mocks.memosRepo.strongBuyCount.mockResolvedValue(7);
      expect(await getStrongBuyCount()).toBe(7);
    });
  });

  // ---------------------------------------------------------------------------
  // searchMemos / searchMemosCount
  // ---------------------------------------------------------------------------
  describe("searchMemos() / searchMemosCount()", () => {
    it("delegates to repo with filters", async () => {
      mocks.memosRepo.search.mockResolvedValue([]);
      mocks.memosRepo.searchCount.mockResolvedValue(0);
      const filters = {
        query: "AI",
        recommendation: "STRONG BUY",
        minConfidence: 80,
      };
      await searchMemos(filters);
      expect(mocks.memosRepo.search).toHaveBeenCalledWith(filters);
    });

    it("returns count", async () => {
      mocks.memosRepo.searchCount.mockResolvedValue(5);
      expect(await searchMemosCount({})).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // Analytics helpers
  // ---------------------------------------------------------------------------
  describe("trackMemoViewed / trackMemoExported", () => {
    it("trackMemoViewed emits analytics event", () => {
      trackMemoViewed("m-1", "opp-1");
      // emitAnalytics calls console.info(label, jsonString)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("memo_viewed"),
      );
    });

    it("trackMemoExported emits analytics event with format", () => {
      trackMemoExported("m-1", "opp-1", "pdf");
      // emitAnalytics calls console.info(label, jsonString)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("memo_exported"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"format":"pdf"'),
      );
    });
  });
});