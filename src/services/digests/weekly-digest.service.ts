/**
 * Weekly Digest service.
 *
 * Orchestrates:
 *   1. `generateDigest(userId, week)` — aggregate last 7d of activity
 *      (alerts, watchlists, opportunities) into a `WeeklyDigestStats`
 *      payload + serialized `content` blob.
 *   2. `queueDigest(userId)` — create a queued row in `weekly_digests`
 *      for the current ISO week, honoring `weekly_digest_enabled`.
 *   3. `sendDigest(id)` — render the HTML/text wrapper, dispatch via
 *      Resend, mark sent/failed.
 *   4. `sendPendingDigests()` — drain the queue (called by the cron).
 *
 * The service deliberately uses repositories (not the Supabase client
 * directly) so all DB access flows through one place.
 */

import { WeeklyDigestsRepository } from "@/lib/db/repositories/weekly-digests.repository";
import { AlertsRepository } from "@/lib/db/repositories/alerts.repository";
import { WatchlistsRepository } from "@/lib/db/repositories/watchlists.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { OpportunityInsightsRepository } from "@/lib/db/repositories/opportunity-insights.repository";
import { OpportunityForecastsRepository } from "@/lib/db/repositories/opportunity-forecasts.repository";
import { MarketIntelligenceRepository } from "@/lib/db/repositories/market-intelligence.repository";
import { NotificationSettingsRepository } from "@/lib/db/repositories/email-notifications.repository";
import { StartupScoresRepository } from "@/lib/db/repositories/startup-scores.repository";
import { InvestmentMemosRepository } from "@/lib/db/repositories/investment-memos.repository";
import { OpportunityBacktestsRepository } from "@/lib/db/repositories/opportunity-backtests.repository";
import { sendEmail } from "@/lib/email/resend.provider";
import {
  renderWeeklyDigestHtml,
  renderWeeklyDigestText,
} from "@/lib/email/templates/weekly-digest-email";
import type {
  WeeklyDigestEmailContext,
  WeeklyDigestStats,
  WeeklyDigestView,
} from "@/types/weekly-digest";
import type { Uuid } from "@/types";

const WEEK_DAYS = 7;
const TOP_CLUSTERS_LIMIT = 5;
const TOP_OPPORTUNITIES_LIMIT = 5;
const TOP_FORECASTS_LIMIT = 5;
const TOP_MARKET_SIGNALS_LIMIT = 5;
const TOP_INVESTMENT_GRADES_LIMIT = 5;
const TOP_INVESTMENT_MEMOS_LIMIT = 5;
/** Sprint 56: only surface overall_score >= this in the digest. */
const INVESTMENT_GRADE_DISPLAY_MIN = 90;
/** Sprint 58: surface memos with confidence >= this in the digest. */
const INVESTMENT_MEMO_DISPLAY_MIN = 80;

const EMAIL_SUBJECT_PREFIX = "[Opportunity Hunter] Your weekly digest";

interface UserIdentity {
  email: string;
  name: string | null;
}

interface SerializedActivity {
  alerts_count: number;
  watchlists_count: number;
  opportunities_count: number;
  opportunities: Array<{
    id: Uuid;
    title: string;
    score: number;
    cluster_name: string;
  }>;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

/**
 * Returns the [weekStart, weekEnd] ISO date strings for the current
 * Mon–Sun window. Week ends are inclusive.
 */
export function getCurrentWeekRange(now: Date = new Date()): { weekStart: Date; weekEnd: Date } {
  const day = now.getUTCDay(); // 0 = Sun ... 6 = Sat
  // Treat Monday as the first day of the week (ISO).
  const offset = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - offset);
  weekStart.setUTCHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + (WEEK_DAYS - 1));
  weekEnd.setUTCHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export class WeeklyDigestService {
  constructor(
    private digestsRepo: WeeklyDigestsRepository,
    private alertsRepo: AlertsRepository,
    private watchlistsRepo: WatchlistsRepository,
    private opportunitiesRepo: OpportunitiesRepository,
    private insightsRepo: OpportunityInsightsRepository,
    private settingsRepo: NotificationSettingsRepository,
    private forecastsRepo: OpportunityForecastsRepository,
    private intelligenceRepo: MarketIntelligenceRepository,
    private startupScoresRepo: StartupScoresRepository,
    private investmentMemosRepo: InvestmentMemosRepository,
    private backtestsRepo?: OpportunityBacktestsRepository,
  ) {}

  static async create(): Promise<WeeklyDigestService> {
    const [
      digestsRepo,
      alertsRepo,
      watchlistsRepo,
      opportunitiesRepo,
      insightsRepo,
      settingsRepo,
      forecastsRepo,
      intelligenceRepo,
      startupScoresRepo,
      investmentMemosRepo,
      backtestsRepo,
    ] = await Promise.all([
      WeeklyDigestsRepository.create(),
      AlertsRepository.create(),
      WatchlistsRepository.create(),
      OpportunitiesRepository.create(),
      OpportunityInsightsRepository.create(),
      NotificationSettingsRepository.create(),
      OpportunityForecastsRepository.create(),
      MarketIntelligenceRepository.create(),
      StartupScoresRepository.create(),
      InvestmentMemosRepository.create(),
      OpportunityBacktestsRepository.create(),
    ]);
    return new WeeklyDigestService(
      digestsRepo,
      alertsRepo,
      watchlistsRepo,
      opportunitiesRepo,
      insightsRepo,
      settingsRepo,
      forecastsRepo,
      intelligenceRepo,
      startupScoresRepo,
      investmentMemosRepo,
      backtestsRepo,
    );
  }

  /**
   * Aggregate the last 7 days of activity for a user and emit a
   * `WeeklyDigestStats` payload plus a serialized JSON `content` row
   * stored on the `weekly_digests` table.
   */
  async generateDigest(userId: Uuid, now: Date = new Date()): Promise<{
    stats: WeeklyDigestStats;
    content: string;
    weekStart: string;
    weekEnd: string;
  }> {
    const { weekStart, weekEnd } = getCurrentWeekRange(now);
    const weekStartStr = toDateInput(weekStart);
    const weekEndStr = toDateInput(weekEnd);

    const activity = await this.collectUserActivity(userId);
    const stats = await this.applyStartupScoreEnrichment(
      await this.applyIntelligenceEnrichment(
        await this.applyForecastEnrichment(
          await this.applyAiInsightEnrichment(
            await this.applyBacktestEnrichment(
              await this.applyInvestmentMemoEnrichment(
                this.summarize(activity),
              ),
            ),
          ),
        ),
      ),
    );

    const enrichedStats: WeeklyDigestStats = {
      ...stats,
      week_start: weekStartStr,
      week_end: weekEndStr,
    };

    const content = JSON.stringify({
      version: 1,
      user_id: userId,
      week_start: weekStartStr,
      week_end: weekEndStr,
      stats: enrichedStats,
    });

    return { stats: enrichedStats, content, weekStart: weekStartStr, weekEnd: weekEndStr };
  }

  /**
   * Create a queued `weekly_digests` row for the current week (idempotent).
   * Returns null when the user has the digest disabled.
   */
  async queueDigest(userId: Uuid, now: Date = new Date()): Promise<Uuid | null> {
    const settings = await this.settingsRepo.getOrCreate(userId);
    if (!settings?.weekly_digest_enabled) return null;

    const { weekStart, weekEnd } = getCurrentWeekRange(now);
    const weekStartStr = toDateInput(weekStart);
    const weekEndStr = toDateInput(weekEnd);

    const generated = await this.generateDigest(userId, now);

    const row = await this.digestsRepo.create({
      user_id: userId,
      week_start: weekStartStr,
      week_end: weekEndStr,
      content: generated.content,
    });

    return row.id;
  }

  /**
   * Send a single queued digest. Idempotent in spirit: if the digest is
   * already sent/failed we leave it alone.
   */
  async sendDigest(digestId: Uuid): Promise<boolean> {
    const digests = await this.digestsRepo.listPending(100);
    const target = digests.find((d) => d.id === digestId);
    if (!target) return false;

    const settings = await this.settingsRepo.getOrCreate(target.user_id);
    if (!settings?.weekly_digest_enabled) {
      // User disabled digests after we queued — fail so operators can see.
      await this.digestsRepo.markFailed(digestId);
      return false;
    }

    const identity = await this.resolveUser(target.user_id);
    if (!identity) {
      await this.digestsRepo.markFailed(digestId);
      return false;
    }

    const parsed = parseStoredContent(target.content);
    if (!parsed) {
      await this.digestsRepo.markFailed(digestId);
      return false;
    }

    const context = buildEmailContext(identity, parsed.stats);
    const result = await sendEmail({
      to: identity.email,
      subject: `${EMAIL_SUBJECT_PREFIX} · ${formatRange(parsed.stats)}`,
      html: renderWeeklyDigestHtml(context),
      text: renderWeeklyDigestText(context),
    });

    if (result.success) {
      await this.digestsRepo.markSent(digestId);
      return true;
    }

    await this.digestsRepo.markFailed(digestId);
    return false;
  }

  /**
   * Drain the pending digest queue. Returns a tiny aggregate so callers
   * (cron, scripts) can log a one-liner.
   */
  async sendPendingDigests(): Promise<{ sent: number; failed: number }> {
    const pending = await this.digestsRepo.listPending(50);
    let sent = 0;
    let failed = 0;

    for (const digest of pending) {
      const ok = await this.sendDigest(digest.id);
      if (ok) sent++;
      else failed++;
    }

    return { sent, failed };
  }

  /**
   * List every digest for a user — powers `/digests`.
   */
  async listDigestsForUser(userId: Uuid): Promise<WeeklyDigestView[]> {
    const rows = await this.digestsRepo.listByUser(userId);
    return rows.map((row) => {
      const parsed = row.content ? parseStoredContent(row.content) : null;
      return {
        ...row,
        stats: parsed?.stats ?? null,
      };
    });
  }

  // -------------------------------------------------------------------
  // private helpers
  // -------------------------------------------------------------------

  private async collectUserActivity(userId: Uuid): Promise<SerializedActivity> {
    const [alerts, watchlists, topOpps, totalOpportunities] = await Promise.all([
      this.alertsRepo.listByUser(userId),
      this.watchlistsRepo.listByUser(userId),
      this.opportunitiesRepo.listTopWithCluster(TOP_OPPORTUNITIES_LIMIT),
      this.opportunitiesRepo.count(),
    ]);

    const opportunities = topOpps.map((opp) => ({
      id: opp.id,
      title: opp.title,
      score: typeof opp.score === "number" ? opp.score : Number(opp.score) || 0,
      cluster_name: opp.pain_clusters?.name ?? "Unknown",
    }));

    return {
      alerts_count: alerts.length,
      watchlists_count: watchlists.length,
      opportunities_count: totalOpportunities,
      opportunities,
    };
  }

  private summarize(activity: SerializedActivity): WeeklyDigestStats {
    const scores = activity.opportunities.map((o) => o.score);
    const buyingIntents = activity.opportunities.map((o) => o.score); // score already blends buying intent in v2

    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const highestBuyingIntent =
      buyingIntents.length > 0 ? Math.max(...buyingIntents) / 100 : 0;

    const clusterCounts = new Map<string, number>();
    for (const opp of activity.opportunities) {
      clusterCounts.set(
        opp.cluster_name,
        (clusterCounts.get(opp.cluster_name) ?? 0) + 1,
      );
    }
    const topClusters = [...clusterCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_CLUSTERS_LIMIT);

    // `week_start` and `week_end` are filled by `generateDigest` — only
    // synthesize cluster/opportunity summaries here.
    return {
      week_start: "",
      week_end: "",
      alerts_count: activity.alerts_count,
      watchlists_count: activity.watchlists_count,
      opportunities_count: activity.opportunities_count,
      total_opportunities_global: activity.opportunities_count,
      average_score: averageScore,
      highest_score: highestScore,
      highest_buying_intent: highestBuyingIntent,
      top_clusters: topClusters,
      top_opportunities: activity.opportunities.map((opp) => {
        const id = opp.id;
        const url = `${getBaseUrl()}/opportunities/${id}`;
        return {
          id,
          title: opp.title,
          score: opp.score,
          cluster_name: opp.cluster_name,
          url,
        };
      }),
      ai_summary: null,
      top_recommendation: null,
      top_forecasts: [],
      top_market_signals: [],
      top_investment_grades: [],
      top_investment_memos: [],
      prediction_accuracy_summary: null,
    };
  }

  /**
   * Sprint 59: Enrich the digest with prediction accuracy summary.
   */
  private async applyBacktestEnrichment(
    stats: WeeklyDigestStats,
  ): Promise<WeeklyDigestStats> {
    const repo = this.backtestsRepo;
    if (!repo) return stats;
    const btStats = await repo.getStats().catch(() => null);
    if (!btStats || btStats.total === 0) return stats;
    return {
      ...stats,
      prediction_accuracy_summary: {
        average_accuracy: btStats.averageAccuracy,
        average_delta: btStats.averageDelta,
        successful_predictions: btStats.successfulPredictions,
        failed_predictions: btStats.failedPredictions,
      },
    };
  }

  /**
   * Enrich the summary with the top forecasted opportunities.
   * Collapses to an empty array when no forecasts exist yet so the
   * email/section degrades gracefully.
   */
  private async applyForecastEnrichment(
    stats: WeeklyDigestStats,
  ): Promise<WeeklyDigestStats> {
    const forecasts = await this.forecastsRepo.listTopForecasts(TOP_FORECASTS_LIMIT);
    if (forecasts.length === 0) return stats;

    const oppIds = [...new Set(forecasts.map((f) => f.opportunity_id))];
    const opportunities = await this.opportunitiesRepo.findByIds(oppIds);
    const titleMap = new Map(opportunities.map((o) => [o.id, o.title]));

    return {
      ...stats,
      top_forecasts: forecasts.map((f) => ({
        opportunity_id: f.opportunity_id,
        title: titleMap.get(f.opportunity_id) ?? "Unknown",
        url: `${getBaseUrl()}/opportunities/${f.opportunity_id}`,
        forecast_score: f.forecast_score,
        growth_probability: f.growth_probability,
        momentum: f.momentum,
      })),
    };
  }

  /**
   * Enrich the summary with the top market intelligence signals (Sprint 55).
   * Aggregates 6 external signals (Reddit, GitHub, Product Hunt, News,
   * Google Trends, Jobs) + overall_score + confidence.
   */
  private async applyIntelligenceEnrichment(
    stats: WeeklyDigestStats,
  ): Promise<WeeklyDigestStats> {
    const signals = await this.intelligenceRepo.listCards({
      limit: TOP_MARKET_SIGNALS_LIMIT,
    });
    if (signals.length === 0) return stats;

    return {
      ...stats,
      top_market_signals: signals.map((s) => ({
        opportunity_id: s.opportunity_id,
        title: s.opportunity_title,
        url: `${getBaseUrl()}/opportunities/${s.opportunity_id}`,
        overall_score: s.overall_score,
        confidence: s.confidence,
        reddit_score: s.reddit_score,
        github_score: s.github_score,
        product_hunt_score: s.product_hunt_score,
        news_score: s.news_score,
        google_trends_score: s.google_trends_score,
        jobs_score: s.jobs_score,
      })),
    };
  }

  /**
   * Enrich the summary with top VC-style investment grades (Sprint 56).
   * Filter to overall_score >= INVESTMENT_GRADE_DISPLAY_MIN so we only
   * surface truly investment-grade opportunities.
   * Empty array when no records exist yet.
   */
  private async applyStartupScoreEnrichment(
    stats: WeeklyDigestStats,
  ): Promise<WeeklyDigestStats> {
    const scores = await this.startupScoresRepo.listCards({
      limit: TOP_INVESTMENT_GRADES_LIMIT,
      minScore: INVESTMENT_GRADE_DISPLAY_MIN,
    });
    if (scores.length === 0) return stats;

    return {
      ...stats,
      top_investment_grades: scores.map((s: import("@/types/startup-score").StartupScoreCardData) => ({
        opportunity_id: s.opportunity_id,
        title: s.opportunity_title,
        url: `${getBaseUrl()}/opportunities/${s.opportunity_id}`,
        overall_score: s.overall_score,
        recommendation: s.recommendation ?? "Watch",
        tam_score: s.tam_score,
        market_timing_score: s.market_timing_score,
        competition_score: s.competition_score,
        moat_score: s.moat_score,
        distribution_score: s.distribution_score,
        execution_score: s.execution_score,
        capital_efficiency_score: s.capital_efficiency_score,
      })),
    };
  }

  /**
   * Enrich the summary with top investment memos (Sprint 58).
   * Surfaces concise, decision-oriented memos for opportunities with
   * confidence >= INVESTMENT_MEMO_DISPLAY_MIN.
   * Empty array when no records exist yet.
   */
  private async applyInvestmentMemoEnrichment(
    stats: WeeklyDigestStats,
  ): Promise<WeeklyDigestStats> {
    const cards = await this.investmentMemosRepo.listCards({
      limit: TOP_INVESTMENT_MEMOS_LIMIT,
      minConfidence: INVESTMENT_MEMO_DISPLAY_MIN,
    });
    if (cards.length === 0) return stats;

    // Pull investment decisions in bulk so the digest can show the
    // one-line directive per memo.
    const memoIds = cards.map((c) => c.id);
    const memos = await this.investmentMemosRepo.list({ limit: 1000 });
    const decisionMap = new Map(
      memos
        .filter((m) => memoIds.includes(m.id))
        .map((m) => [m.id, m.investment_decision] as const),
    );

    return {
      ...stats,
      top_investment_memos: cards.map((c) => ({
        id: c.id,
        opportunity_id: c.opportunity_id,
        title: c.opportunity_title,
        url: `${getBaseUrl()}/opportunities/${c.opportunity_id}`,
        confidence: c.confidence,
        recommendation: c.recommendation,
        investment_decision: decisionMap.get(c.id) ?? "—",
        created_at: c.created_at,
      })),
    };
  }

  /**
   * Enrich the synchronous summary with the latest AI insights.
   * Called once per digest generation; collapses to `null` when no
   * insights are available so the email can decide what to render.
   */
  private async applyAiInsightEnrichment(
    stats: WeeklyDigestStats,
  ): Promise<WeeklyDigestStats> {
    const insights = await this.insightsRepo.listRecentCards(TOP_OPPORTUNITIES_LIMIT);
    if (insights.length === 0) return stats;

    const top = insights[0];
    if (!top) return stats;

    const summaryParts = insights
      .slice(0, 3)
      .map((i) => `${i.opportunity_title}: ${i.summary}`)
      .join(" | ");

    return {
      ...stats,
      ai_summary: summaryParts,
      top_recommendation: {
        opportunity_id: top.opportunity_id,
        title: top.opportunity_title,
        url: `${getBaseUrl()}/opportunities/${top.opportunity_id}`,
        confidence_score: top.confidence_score,
        summary: top.summary,
      },
    };
  }

  private async resolveUser(userId: Uuid): Promise<UserIdentity | null> {
    // The Supabase client is held by `digestsRepo`; we re-use it to query
    // `profiles` rather than introduce another repository just for one row.
    const client = (this.digestsRepo as unknown as { client: import("@supabase/supabase-js").SupabaseClient }).client;
    const { data, error } = await client
      .from("profiles")
      .select("email, name")
      .eq("id", userId)
      .maybeSingle<UserIdentity>();

    if (error || !data) return null;
    return { email: data.email, name: data.name };
  }
}

function parseStoredContent(content: string): { stats: WeeklyDigestStats } | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (
      parsed && typeof parsed === "object" &&
      "stats" in parsed &&
      parsed.stats && typeof parsed.stats === "object"
    ) {
      return { stats: parsed.stats as WeeklyDigestStats };
    }
    return null;
  } catch {
    return null;
  }
}

function buildEmailContext(identity: UserIdentity, stats: WeeklyDigestStats): WeeklyDigestEmailContext {
  return {
    userEmail: identity.email,
    userName: identity.name,
    weekStart: stats.week_start,
    weekEnd: stats.week_end,
    stats,
    settingsUrl: `${getBaseUrl()}/profile`,
    historyUrl: `${getBaseUrl()}/digests`,
    unsubscribeUrl: `${getBaseUrl()}/profile#weekly-digest`,
  };
}

function formatRange(stats: WeeklyDigestStats): string {
  const start = new Date(stats.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const end = new Date(stats.week_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${start} – ${end}`;
}
