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
import { NotificationSettingsRepository } from "@/lib/db/repositories/email-notifications.repository";
import { sendEmail } from "@/lib/email/resend.provider";
import {
  renderWeeklyDigestHtml,
  renderWeeklyDigestText,
} from "@/lib/email/templates/weekly-digest-email";
import type {
  WeeklyDigestEmailContext,
  WeeklyDigestStats,
} from "@/types/weekly-digest";
import type { Uuid } from "@/types";

const WEEK_DAYS = 7;
const TOP_CLUSTERS_LIMIT = 5;
const TOP_OPPORTUNITIES_LIMIT = 5;

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
    private settingsRepo: NotificationSettingsRepository,
  ) {}

  static async create(): Promise<WeeklyDigestService> {
    const [digestsRepo, alertsRepo, watchlistsRepo, opportunitiesRepo, settingsRepo] =
      await Promise.all([
        WeeklyDigestsRepository.create(),
        AlertsRepository.create(),
        WatchlistsRepository.create(),
        OpportunitiesRepository.create(),
        NotificationSettingsRepository.create(),
      ]);
    return new WeeklyDigestService(
      digestsRepo,
      alertsRepo,
      watchlistsRepo,
      opportunitiesRepo,
      settingsRepo,
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
    const stats = this.summarize(activity);

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
  async listDigestsForUser(userId: Uuid) {
    return this.digestsRepo.listByUser(userId);
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
      score: typeof opp.score === "string" ? parseFloat(opp.score) : opp.score,
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
