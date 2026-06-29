/**
 * Market Intelligence Repository (Sprint 55).
 *
 * CRUD operations for market_intelligence table.
 * Stores aggregated external market signals for validated opportunities.
 */

import type {
  MarketIntelligenceInsert,
  MarketIntelligenceRow,
  MarketIntelligenceCardData,
} from "@/types/market-intelligence";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "market_intelligence";

export type { MarketIntelligenceRow, MarketIntelligenceInsert };

export class MarketIntelligenceRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<MarketIntelligenceRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new MarketIntelligenceRepository(
      await getSupabaseServerClient(),
    );
  }

  /** Insert a single market intelligence record. */
  async create(
    record: MarketIntelligenceInsert,
  ): Promise<MarketIntelligenceRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(record)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as MarketIntelligenceRow;
  }

  /** Insert multiple market intelligence records. */
  async createMany(
    records: MarketIntelligenceInsert[],
  ): Promise<MarketIntelligenceRow[]> {
    if (records.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(records)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as MarketIntelligenceRow[];
  }

  /** Find market intelligence record for an opportunity. */
  async findByOpportunity(
    opportunityId: string,
  ): Promise<MarketIntelligenceRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as MarketIntelligenceRow | null;
  }

  /** Delete all intelligence records for an opportunity. */
  async deleteByOpportunity(opportunityId: string): Promise<number> {
    const { count: beforeCount } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true })
      .eq("opportunity_id", opportunityId);

    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("opportunity_id", opportunityId);

    if (error) throw translateError(ENTITY, error);
    return beforeCount ?? 0;
  }

  /** List intelligence rows with pagination. */
  async list(opts: {
    limit?: number;
    offset?: number;
    minScore?: number;
    orderBy?: "overall_score" | "confidence" | "created_at";
    ascending?: boolean;
  } = {}): Promise<MarketIntelligenceRow[]> {
    const {
      limit = 50,
      offset = 0,
      minScore,
      orderBy = "overall_score",
      ascending = false,
    } = opts;

    let query = this.client.from(ENTITY).select("*");

    if (minScore !== undefined) {
      query = query.gte("overall_score", minScore);
    }

    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as MarketIntelligenceRow[];
  }

  /** Top market intelligence records by overall_score. */
  async listTop(limit: number = 10): Promise<MarketIntelligenceRow[]> {
    return this.list({ limit, orderBy: "overall_score", ascending: false });
  }

  /** Total count of intelligence records. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Average overall_score across all intelligence records. */
  async averageScore(): Promise<number> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("overall_score");

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, row) => acc + row.overall_score, 0);
    return Math.round((sum / data.length) * 100) / 100;
  }

  /** Highest overall_score. */
  async topScore(): Promise<number> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("overall_score")
      .order("overall_score", { ascending: false })
      .limit(1);

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;
    return data[0].overall_score;
  }

  /** Average confidence across all records. */
  async averageConfidence(): Promise<number> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("confidence");

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, row) => acc + row.confidence, 0);
    return Math.round((sum / data.length) * 100) / 100;
  }

  /** Get the opportunity_id with the highest overall_score. */
  async mostDiscussedOpportunityId(): Promise<string | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("opportunity_id, overall_score")
      .order("overall_score", { ascending: false })
      .limit(1);

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return null;
    return data[0].opportunity_id;
  }

  /**
   * List market intelligence records joined with opportunity + cluster
   * details. Powers the dashboard table.
   */
  async listCards(opts: {
    limit?: number;
    offset?: number;
    minScore?: number;
  } = {}): Promise<MarketIntelligenceCardData[]> {
    const { limit = 50, offset = 0, minScore } = opts;

    let query = this.client
      .from(ENTITY)
      .select(
        `
        *,
        opportunity:opportunities(
          id,
          title,
          pain_cluster:pain_clusters(name)
        )
      `,
      );

    if (minScore !== undefined) {
      query = query.gte("overall_score", minScore);
    }

    query = query
      .order("overall_score", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);

    type RawRow = MarketIntelligenceRow & {
      opportunity?: {
        id: string;
        title: string;
        pain_cluster?: { name: string } | null;
      } | null;
    };

    const rows = (data ?? []) as RawRow[];

    return rows.map((row) => ({
      id: row.id,
      opportunity_id: row.opportunity_id,
      opportunity_title: row.opportunity?.title ?? "Unknown",
      cluster_name: row.opportunity?.pain_cluster?.name ?? null,
      reddit_score: row.reddit_score,
      github_score: row.github_score,
      product_hunt_score: row.product_hunt_score,
      news_score: row.news_score,
      google_trends_score: row.google_trends_score,
      jobs_score: row.jobs_score,
      overall_score: row.overall_score,
      confidence: row.confidence,
      summary: row.summary,
      created_at: row.created_at,
    }));
  }

  /**
   * Aggregate stats object for the dashboard.
   */
  async getStats(): Promise<{
    total: number;
    averageOverallScore: number;
    highestOverallScore: number;
    averageConfidence: number;
    averageRedditScore: number;
    averageGithubScore: number;
    averageProductHuntScore: number;
    averageNewsScore: number;
    averageGoogleTrendsScore: number;
    averageJobsScore: number;
  }> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as MarketIntelligenceRow[];

    if (rows.length === 0) {
      return {
        total: 0,
        averageOverallScore: 0,
        highestOverallScore: 0,
        averageConfidence: 0,
        averageRedditScore: 0,
        averageGithubScore: 0,
        averageProductHuntScore: 0,
        averageNewsScore: 0,
        averageGoogleTrendsScore: 0,
        averageJobsScore: 0,
      };
    }

    const sum = (key: keyof MarketIntelligenceRow): number =>
      rows.reduce((acc, row) => acc + (row[key] as number), 0);

    return {
      total: rows.length,
      averageOverallScore: round2(sum("overall_score") / rows.length),
      highestOverallScore: Math.max(...rows.map((r) => r.overall_score)),
      averageConfidence: round2(sum("confidence") / rows.length),
      averageRedditScore: round2(sum("reddit_score") / rows.length),
      averageGithubScore: round2(sum("github_score") / rows.length),
      averageProductHuntScore: round2(sum("product_hunt_score") / rows.length),
      averageNewsScore: round2(sum("news_score") / rows.length),
      averageGoogleTrendsScore: round2(sum("google_trends_score") / rows.length),
      averageJobsScore: round2(sum("jobs_score") / rows.length),
    };
  }

  /**
   * Signal distribution: count of records bucketed by overall_score range.
   * Powers the admin "Signal distribution" chart.
   */
  async getSignalDistribution(): Promise<Array<{ bucket: string; count: number; minScore: number; maxScore: number }>> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("overall_score");

    if (error) throw translateError(ENTITY, error);
    const scores = ((data ?? []) as Array<{ overall_score: number }>).map(
      (r) => r.overall_score,
    );

    const buckets = [
      { bucket: "0-20", minScore: 0, maxScore: 20, count: 0 },
      { bucket: "21-40", minScore: 21, maxScore: 40, count: 0 },
      { bucket: "41-60", minScore: 41, maxScore: 60, count: 0 },
      { bucket: "61-80", minScore: 61, maxScore: 80, count: 0 },
      { bucket: "81-100", minScore: 81, maxScore: 100, count: 0 },
    ];

    for (const score of scores) {
      const b = buckets.find((b) => score >= b.minScore && score <= b.maxScore);
      if (b) b.count++;
    }

    return buckets;
  }

  /**
   * Time series of intelligence records by day, for the admin history chart.
   */
  async getHistory(days: number = 30): Promise<Array<{ date: string; count: number; avgScore: number }>> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("created_at, overall_score")
      .order("created_at", { ascending: true });

    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as Array<{ created_at: string; overall_score: number }>;

    // Group by YYYY-MM-DD
    const byDate = new Map<string, { count: number; sumScore: number }>();
    for (const row of rows) {
      const dateKey = row.created_at.slice(0, 10);
      const entry = byDate.get(dateKey) ?? { count: 0, sumScore: 0 };
      entry.count += 1;
      entry.sumScore += row.overall_score;
      byDate.set(dateKey, entry);
    }

    return Array.from(byDate.entries())
      .map(([date, entry]) => ({
        date,
        count: entry.count,
        avgScore: round2(entry.sumScore / entry.count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-days);
  }

  /**
   * Confidence over time series for the admin chart.
   */
  async getConfidenceHistory(days: number = 30): Promise<Array<{ date: string; avgConfidence: number }>> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("created_at, confidence")
      .order("created_at", { ascending: true });

    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as Array<{ created_at: string; confidence: number }>;

    const byDate = new Map<string, { count: number; sumConfidence: number }>();
    for (const row of rows) {
      const dateKey = row.created_at.slice(0, 10);
      const entry = byDate.get(dateKey) ?? { count: 0, sumConfidence: 0 };
      entry.count += 1;
      entry.sumConfidence += row.confidence;
      byDate.set(dateKey, entry);
    }

    return Array.from(byDate.entries())
      .map(([date, entry]) => ({
        date,
        avgConfidence: round2(entry.sumConfidence / entry.count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-days);
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}