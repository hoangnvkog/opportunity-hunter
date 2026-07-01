/**
 * Weekly digest service tests.
 *
 * Covers the four Sprint 45 test categories:
 *   - aggregation    : generateDigest collapses raw inputs into stats
 *   - queue          : queueDigest honors user opt-out + creates a row
 *   - email          : sendDigest renders/Resend/marks sent+failure paths
 *   - ownership      : listDigestsForUser only returns rows for the user
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { WeeklyDigestService, getCurrentWeekRange } from "../weekly-digest.service";
import {
  renderWeeklyDigestHtml,
  renderWeeklyDigestText,
} from "@/lib/email/templates/weekly-digest-email";
import type { Uuid } from "@/types";
import type { WeeklyDigestStats } from "@/types/weekly-digest";

// Hoisted module mocks (vi.mock declarations must precede imports-eval).
vi.mock("@/lib/email/resend.provider", () => ({
  sendEmail: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import { sendEmail } from "@/lib/email/resend.provider";

function buildService() {
  const digestsRepo: Partial<import("@/lib/db/repositories/weekly-digests.repository").WeeklyDigestsRepository> = {
    create: vi.fn(),
    markSent: vi.fn(),
    markFailed: vi.fn(),
    listPending: vi.fn(),
    listByUser: vi.fn(),
  };
  const alertsRepo = { listByUser: vi.fn() };
  const watchlistsRepo = { listByUser: vi.fn() };
  const opportunitiesRepo = {
    listTopWithCluster: vi.fn(),
    count: vi.fn(),
  };
  const insightsRepo = {
    listRecentCards: vi.fn().mockResolvedValue([]),
  };
  const settingsRepo = { getOrCreate: vi.fn() };
  const forecastsRepo = {
    listTopForecasts: vi.fn().mockResolvedValue([]),
  };
  const intelligenceRepo = {
    listCards: vi.fn().mockResolvedValue([]),
  };
  const startupScoresRepo = {
    listCards: vi.fn().mockResolvedValue([]),
  };

  const investmentMemosRepo = {
    listCards: vi.fn().mockResolvedValue([]),
    list: vi.fn().mockResolvedValue([]),
  };

  const service = new WeeklyDigestService(
    digestsRepo as unknown as import("@/lib/db/repositories/weekly-digests.repository").WeeklyDigestsRepository,
    alertsRepo as never,
    watchlistsRepo as never,
    opportunitiesRepo as never,
    insightsRepo as never,
    settingsRepo as never,
    forecastsRepo as never,
    intelligenceRepo as never,
    startupScoresRepo as never,
    investmentMemosRepo as never,
  );

  return {
    service,
    digestsRepo: digestsRepo as unknown as {
      create: ReturnType<typeof vi.fn>;
      markSent: ReturnType<typeof vi.fn>;
      markFailed: ReturnType<typeof vi.fn>;
      listPending: ReturnType<typeof vi.fn>;
      listByUser: ReturnType<typeof vi.fn>;
    },
    alertsRepo,
    watchlistsRepo,
    opportunitiesRepo,
    settingsRepo,
    forecastsRepo,
    intelligenceRepo,
    startupScoresRepo,
    investmentMemosRepo,
  };
}

const USER_ID = "user-1" as Uuid;

const baseStats = (): WeeklyDigestStats => ({
  week_start: "2026-06-16",
  week_end: "2026-06-22",
  alerts_count: 2,
  watchlists_count: 3,
  opportunities_count: 25,
  total_opportunities_global: 25,
  average_score: 60.5,
  highest_score: 92.3,
  highest_buying_intent: 0.81,
  top_clusters: [
    { name: "Cold Outreach Pain", count: 4 },
    { name: "Invoicing Friction", count: 3 },
  ],
  top_opportunities: [
    {
      id: "opp-1" as Uuid,
      title: "AI billing watchdog",
      score: 92.3,
      cluster_name: "Cold Outreach Pain",
      url: "http://localhost:3000/opportunities/opp-1",
    },
  ],
  ai_summary: null,
  top_recommendation: null,
  top_forecasts: [],
  top_market_signals: [],
  top_investment_grades: [],
  top_investment_memos: [],
  portfolio_summary: null,
  prediction_accuracy_summary: null,
});

describe("WeeklyDigestService", () => {
  let set: ReturnType<typeof buildService>;

  beforeEach(() => {
    vi.clearAllMocks();
    set = buildService();
  });

  // -------------------------------------------------------------------
  // 1. aggregation
  // -------------------------------------------------------------------

  describe("generateDigest (aggregation)", () => {
    it("summarizes alerts/watchlists/opportunities and prunes top-N", async () => {
      set.alertsRepo.listByUser.mockResolvedValue([{ id: "a1" }, { id: "a2" }] as never);
      set.watchlistsRepo.listByUser.mockResolvedValue([
        { id: "w1" }, { id: "w2" }, { id: "w3" },
      ] as never);
      set.opportunitiesRepo.count.mockResolvedValue(25);
      set.opportunitiesRepo.listTopWithCluster.mockResolvedValue([
        { id: "opp-1", score: "92.30", title: "AI billing watchdog", pain_clusters: { name: "Cold Outreach Pain" } },
        { id: "opp-2", score: "78.10", title: "Lead scoring helper", pain_clusters: { name: "Cold Outreach Pain" } },
        { id: "opp-3", score: "60.00", title: "Invoicing bot", pain_clusters: { name: "Invoicing Friction" } },
      ] as never);

      const fixedDate = new Date("2026-06-22T05:00:00.000Z");
      const result = await set.service.generateDigest(USER_ID, fixedDate);

      expect(result.stats.alerts_count).toBe(2);
      expect(result.stats.watchlists_count).toBe(3);
      expect(result.stats.opportunities_count).toBe(25);
      expect(result.stats.highest_score).toBeCloseTo(92.3);
      expect(result.stats.average_score).toBeGreaterThan(0);
      expect(result.stats.top_clusters.length).toBeGreaterThan(0);
      expect(result.stats.top_opportunities.length).toBe(3);

      const parsed = JSON.parse(result.content);
      expect(parsed.version).toBe(1);
      expect(parsed.user_id).toBe(USER_ID);
      expect(parsed.week_start).toBe(result.weekStart);
      expect(parsed.week_end).toBe(result.weekEnd);
    });

    it("returns zeroed stats when user has no activity yet", async () => {
      set.alertsRepo.listByUser.mockResolvedValue([] as never);
      set.watchlistsRepo.listByUser.mockResolvedValue([] as never);
      set.opportunitiesRepo.count.mockResolvedValue(0);
      set.opportunitiesRepo.listTopWithCluster.mockResolvedValue([] as never);

      const result = await set.service.generateDigest(USER_ID);

      expect(result.stats.alerts_count).toBe(0);
      expect(result.stats.highest_score).toBe(0);
      expect(result.stats.average_score).toBe(0);
      expect(result.stats.top_clusters).toEqual([]);
      expect(result.stats.top_opportunities).toEqual([]);
    });
  });

  describe("getCurrentWeekRange (date math)", () => {
    it("snaps Wednesday into the Monday–Sunday window of the same ISO week", () => {
      const wed = new Date("2026-06-17T12:34:56.000Z");
      const { weekStart, weekEnd } = getCurrentWeekRange(wed);
      expect(weekStart.toISOString().slice(0, 10)).toBe("2026-06-15");
      expect(weekEnd.toISOString().slice(0, 10)).toBe("2026-06-21");
    });

    it("snaps Sunday back into Monday of the same ISO week", () => {
      const sun = new Date("2026-06-21T23:59:59.000Z");
      const { weekStart, weekEnd } = getCurrentWeekRange(sun);
      expect(weekStart.toISOString().slice(0, 10)).toBe("2026-06-15");
      expect(weekEnd.toISOString().slice(0, 10)).toBe("2026-06-21");
    });
  });

  // -------------------------------------------------------------------
  // 2. queue
  // -------------------------------------------------------------------

  describe("queueDigest", () => {
    it("creates a row when the user has the toggle on", async () => {
      set.settingsRepo.getOrCreate.mockResolvedValue({
        user_id: USER_ID,
        email_enabled: true,
        weekly_digest_enabled: true,
      } as never);
      set.alertsRepo.listByUser.mockResolvedValue([] as never);
      set.watchlistsRepo.listByUser.mockResolvedValue([] as never);
      set.opportunitiesRepo.count.mockResolvedValue(0);
      set.opportunitiesRepo.listTopWithCluster.mockResolvedValue([] as never);
      set.digestsRepo.create.mockImplementation(async (data) => ({
        id: "digest-1",
        user_id: USER_ID,
        content: data.content,
        week_start: data.week_start,
        week_end: data.week_end,
        status: "queued",
        sent_at: null,
        created_at: "2026-06-22T05:00:00Z",
      }));

      const id = await set.service.queueDigest(USER_ID);
      expect(id).toBe("digest-1");
      expect(set.digestsRepo.create).toHaveBeenCalledOnce();
    });

    it("returns null when the user opted out", async () => {
      set.settingsRepo.getOrCreate.mockResolvedValue({
        user_id: USER_ID,
        email_enabled: true,
        weekly_digest_enabled: false,
      } as never);

      const id = await set.service.queueDigest(USER_ID);
      expect(id).toBeNull();
      expect(set.digestsRepo.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------
  // 3. email (send path)
  // -------------------------------------------------------------------

  describe("sendDigest (email)", () => {
    it("renders HTML + text, dispatches Resend, marks sent", async () => {
      const queuedRow = {
        id: "digest-1",
        user_id: USER_ID,
        week_start: "2026-06-16",
        week_end: "2026-06-22",
        content: JSON.stringify({ version: 1, stats: baseStats() }),
        status: "queued" as const,
        sent_at: null,
        created_at: "2026-06-22T05:00:00Z",
      };
      set.digestsRepo.listPending.mockResolvedValue([queuedRow]);
      set.settingsRepo.getOrCreate.mockResolvedValue({
        user_id: USER_ID,
        email_enabled: true,
        weekly_digest_enabled: true,
      } as never);
      (sendEmail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        id: "resend-1",
      });
      set.digestsRepo.markSent.mockResolvedValue({ ...queuedRow, status: "sent" });

      // Inject a fake `client` on digestsRepo for the service's profile lookup.
      (set.digestsRepo as unknown as { client: unknown }).client = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { email: "user@example.com", name: "Quốc Sư" },
                error: null,
              }),
            }),
          }),
        }),
      };

      const ok = await set.service.sendDigest("digest-1" as Uuid);
      expect(ok).toBe(true);
      expect(sendEmail).toHaveBeenCalledOnce();
      const call = (sendEmail as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as { to: string; subject: string; html: string; text: string } | undefined;
      expect(call?.to).toBe("user@example.com");
      expect(call?.subject).toContain("weekly digest");
      expect(call?.html).toContain("Weekly Opportunity Digest");
      expect(call?.text).toContain("Weekly Opportunity Digest");
      expect(set.digestsRepo.markSent).toHaveBeenCalledWith("digest-1");
    });

    it("marks failed when Resend rejects the send", async () => {
      const queuedRow = {
        id: "digest-1",
        user_id: USER_ID,
        week_start: "2026-06-16",
        week_end: "2026-06-22",
        content: JSON.stringify({ version: 1, stats: baseStats() }),
        status: "queued" as const,
        sent_at: null,
        created_at: "2026-06-22T05:00:00Z",
      };
      set.digestsRepo.listPending.mockResolvedValue([queuedRow]);
      set.settingsRepo.getOrCreate.mockResolvedValue({
        user_id: USER_ID,
        email_enabled: true,
        weekly_digest_enabled: true,
      } as never);
      (sendEmail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: "Resend 401",
      });
      set.digestsRepo.markFailed.mockResolvedValue({ ...queuedRow, status: "failed" });

      (set.digestsRepo as unknown as { client: unknown }).client = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { email: "user@example.com", name: null },
                error: null,
              }),
            }),
          }),
        }),
      };

      const ok = await set.service.sendDigest("digest-1" as Uuid);
      expect(ok).toBe(false);
      expect(set.digestsRepo.markFailed).toHaveBeenCalledWith("digest-1");
      expect(set.digestsRepo.markSent).not.toHaveBeenCalled();
    });

    it("sendPendingDigests drains the queue and returns sent/failed counts", async () => {
      set.digestsRepo.listPending.mockResolvedValue([
        { id: "d-1", user_id: USER_ID, week_start: "2026-06-16", week_end: "2026-06-22", content: JSON.stringify({ version: 1, stats: baseStats() }), status: "queued", sent_at: null, created_at: "2026-06-22T05:00:00Z" },
        { id: "d-2", user_id: "user-2", week_start: "2026-06-16", week_end: "2026-06-22", content: JSON.stringify({ version: 1, stats: baseStats() }), status: "queued", sent_at: null, created_at: "2026-06-22T05:00:00Z" },
      ] as never);
      set.settingsRepo.getOrCreate.mockResolvedValue({ user_id: USER_ID, email_enabled: true, weekly_digest_enabled: true } as never);
      (sendEmail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      set.digestsRepo.markSent.mockResolvedValue({} as never);

      (set.digestsRepo as unknown as { client: unknown }).client = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { email: "user@example.com", name: null }, error: null }),
            }),
          }),
        }),
      };

      const result = await set.service.sendPendingDigests();
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  // -------------------------------------------------------------------
  // 4. ownership / history
  // -------------------------------------------------------------------

  describe("listDigestsForUser (ownership)", () => {
    it("delegates to repo.listByUser with the caller user id", async () => {
      const rows = [{ id: "d-1", user_id: USER_ID, week_start: "2026-06-16", week_end: "2026-06-22", content: "{}" }];
      set.digestsRepo.listByUser.mockResolvedValue(rows as never);

      const list = await set.service.listDigestsForUser(USER_ID);
      // result shape now includes `stats`
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe("d-1");
      expect(list[0]?.stats).toBe(null);
      expect(set.digestsRepo.listByUser).toHaveBeenCalledWith(USER_ID);
    });
  });
});

// ---------------------------------------------------------------------
// Email template unit tests (independent of the service)
// ---------------------------------------------------------------------

describe("renderWeeklyDigestHtml / renderWeeklyDigestText", () => {
  const ctx = {
    userEmail: "u@example.com",
    userName: "Quốc Sư",
    weekStart: "2026-06-16",
    weekEnd: "2026-06-22",
    settingsUrl: "http://localhost:3000/profile",
    historyUrl: "http://localhost:3000/digests",
    unsubscribeUrl: "http://localhost:3000/profile#weekly-digest",
    stats: baseStats(),
  };

  it("html escapes user-controlled strings", () => {
    const rawScript = "<script>alert(1)</script>";
    const rawPain = "Pain <Pain>";

    const html = renderWeeklyDigestHtml({
      ...ctx,
      userName: rawScript,
      stats: {
        ...ctx.stats,
        top_clusters: [{ name: rawPain, count: 1 }],
      },
    });

    // After escaping, the live < and > from user input become HTML
    // entities — the script tag survives only as inert text, never as
    // an executable tag.
    const escapedScript = "&lt;script&gt;alert(1)&lt;/script&gt;";
    const escapedPain = "Pain &lt;Pain&gt;";

    expect(html).toContain(escapedScript);
    expect(html).toContain(escapedPain);
  });

  it("plain text includes summary sections and links", () => {
    const text = renderWeeklyDigestText(ctx);
    expect(text).toContain("Hi Quốc Sư");
    expect(text).toContain("SUMMARY");
    expect(text).toContain("RECOMMENDATIONS");
    expect(text).toContain("http://localhost:3000/digests");
  });
});
