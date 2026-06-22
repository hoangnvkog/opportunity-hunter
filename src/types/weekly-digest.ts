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
