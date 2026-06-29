import type { Uuid } from "./database.types";

export type DigestStatus = "queued" | "sent" | "failed";

/**
 * Row type for weekly_digests table
 */
export type WeeklyDigestRow = {
  id: Uuid;
  user_id: Uuid;
  week_start: string;
  week_end: string;
  content: string;
  status: DigestStatus;
  sent_at: string | null;
  created_at: string;
};

/**
 * Insert type for creating weekly digests
 */
export type WeeklyDigestInsert = {
  id?: Uuid;
  user_id: Uuid;
  week_start: string;
  week_end: string;
  content: string;
  status?: DigestStatus;
};

/**
 * Update type — patches `status` and `sent_at`. Identity fields
 * (user_id, week_start) are immutable.
 */
export type WeeklyDigestUpdate = {
  status?: DigestStatus;
  sent_at?: string | null;
};

/**
 * View row for the digests history page; like `WeeklyDigestRow` but
 * with the parsed `WeeklyDigestStats` payload attached (or null when
 * the stored content cannot be parsed).
 */
export type WeeklyDigestView = WeeklyDigestRow & {
  stats: WeeklyDigestStats | null;
};

/**
 * Aggregated metrics used to compose a digest.
 * Numbers are pre-rounded; the digest content is rendered from this shape.
 */
export type WeeklyDigestStats = {
  week_start: string;
  week_end: string;
  alerts_count: number;
  watchlists_count: number;
  opportunities_count: number;
  total_opportunities_global: number;
  average_score: number;
  highest_score: number;
  highest_buying_intent: number;
  top_clusters: ReadonlyArray<{
    name: string;
    count: number;
  }>;
  top_opportunities: ReadonlyArray<{
    id: Uuid;
    title: string;
    score: number;
    cluster_name: string;
    url: string;
  }>;
  /**
   * Sprint 46: AI summary line + top recommendation synthesized from
   * the latest `opportunity_insights`. Null when no insights exist yet
   * (digest still renders; sections degrade gracefully).
   */
  ai_summary: string | null;
  top_recommendation: {
    opportunity_id: Uuid;
    title: string;
    url: string;
    confidence_score: number;
    summary: string;
  } | null;
  /**
   * Sprint 54: Top forecasted opportunities by forecast_score.
   * Empty array when no forecasts exist yet (section degrades gracefully).
   */
  top_forecasts: ReadonlyArray<{
    opportunity_id: Uuid;
    title: string;
    url: string;
    forecast_score: number;
    growth_probability: number;
    momentum: number;
  }>;
  /**
   * Sprint 55: Top market intelligence signals by overall_score.
   * Each entry aggregates 6 external signals + overall_score + confidence.
   * Empty array when no intelligence records exist yet.
   */
  top_market_signals: ReadonlyArray<{
    opportunity_id: Uuid;
    title: string;
    url: string;
    overall_score: number;
    confidence: number;
    reddit_score: number;
    github_score: number;
    product_hunt_score: number;
    news_score: number;
    google_trends_score: number;
    jobs_score: number;
  }>;
};

/**
 * Render context used by the email template.
 * Two separate renderings (HTML + plain text) consume the same shape.
 */
export type WeeklyDigestEmailContext = {
  userEmail: string;
  userName: string | null;
  weekStart: string;
  weekEnd: string;
  stats: WeeklyDigestStats;
  unsubscribeUrl: string;
  settingsUrl: string;
  historyUrl: string;
};
