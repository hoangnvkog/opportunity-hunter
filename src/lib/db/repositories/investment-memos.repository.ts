/**
 * Investment Memos Repository (Sprint 58).
 *
 * CRUD operations for investment_memos table.
 * Stores AI-generated investment memos for top opportunities
 * (startup_score overall_score >= 85).
 */

import type {
  InvestmentMemoInsert,
  InvestmentMemoRow,
  InvestmentMemoCardData,
  InvestmentMemoStats,
  InvestmentMemoSearchFilters,
} from "@/types/investment-memo";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "investment_memos";

export type { InvestmentMemoRow, InvestmentMemoInsert };

/** Threshold above which a memo is generated for an opportunity (Sprint 58 spec). */
export const INVESTMENT_MEMO_SCORE_THRESHOLD = 85;

export class InvestmentMemosRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<InvestmentMemosRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new InvestmentMemosRepository(
      await getSupabaseServerClient(),
    );
  }

  /** Insert a single investment memo record. */
  async create(record: InvestmentMemoInsert): Promise<InvestmentMemoRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert([record] as never)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as InvestmentMemoRow;
  }

  /** Insert multiple investment memo records. */
  async createMany(
    records: InvestmentMemoInsert[],
  ): Promise<InvestmentMemoRow[]> {
    if (records.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(records as never)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as InvestmentMemoRow[];
  }

  /** Find latest investment memo for an opportunity. */
  async findByOpportunity(
    opportunityId: string,
  ): Promise<InvestmentMemoRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as InvestmentMemoRow | null;
  }

  /** Alias for findByOpportunity (latest by created_at desc). */
  async findLatest(opportunityId: string): Promise<InvestmentMemoRow | null> {
    return this.findByOpportunity(opportunityId);
  }

  /** Find by memo id (PK). */
  async findById(id: string): Promise<InvestmentMemoRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as InvestmentMemoRow | null;
  }

  /** List investment memo rows with pagination. */
  async list(opts: {
    limit?: number;
    offset?: number;
    minConfidence?: number;
    recommendation?: string;
    orderBy?: "confidence" | "created_at" | "memo_version";
    ascending?: boolean;
  } = {}): Promise<InvestmentMemoRow[]> {
    const {
      limit = 50,
      offset = 0,
      minConfidence,
      recommendation,
      orderBy = "created_at",
      ascending = false,
    } = opts;

    let query = this.client.from(ENTITY).select("*");

    if (minConfidence !== undefined) {
      query = query.gte("confidence", minConfidence);
    }

    if (recommendation) {
      query = query.ilike("recommendation", recommendation);
    }

    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as InvestmentMemoRow[];
  }

  /** Total count of investment memo records. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Average confidence across all records. */
  async averageConfidence(): Promise<number> {
    const { data, error } = await this.client.from(ENTITY).select("confidence");

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const rows = data as Array<{ confidence: number }>;
    const sum = rows.reduce((acc, row) => acc + row.confidence, 0);
    return round2(sum / rows.length);
  }

  /** Count of STRONG BUY recommendations. */
  async strongBuyCount(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true })
      .ilike("recommendation", "STRONG BUY%");

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Latest memo creation date. */
  async latestMemoDate(): Promise<string | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return (data as { created_at: string } | null)?.created_at ?? null;
  }

  /**
   * List joined card data for the dashboard table.
   * Joins: opportunity (title + cluster), startup_score (overall_score).
   */
  async listCards(opts: {
    limit?: number;
    offset?: number;
    minConfidence?: number;
    recommendation?: string;
  } = {}): Promise<InvestmentMemoCardData[]> {
    const { limit = 50, offset = 0, minConfidence, recommendation } = opts;

    let query = this.client
      .from(ENTITY)
      .select(
        `
        *,
        opportunity:opportunities(
          id,
          title,
          pain_cluster:pain_clusters(name)
        ),
        startup_score:startup_scores(overall_score)
      `,
      );

    if (minConfidence !== undefined) {
      query = query.gte("confidence", minConfidence);
    }
    if (recommendation) {
      query = query.ilike("recommendation", recommendation);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);

    type RawRow = InvestmentMemoRow & {
      opportunity?: {
        id: string;
        title: string;
        pain_cluster?: { name: string } | null;
      } | null;
      startup_score?: { overall_score: number } | null;
    };

    const rows = (data ?? []) as RawRow[];

    return rows.map((row) => ({
      id: row.id,
      opportunity_id: row.opportunity_id,
      opportunity_title: row.opportunity?.title ?? "Unknown",
      cluster_name: row.opportunity?.pain_cluster?.name ?? null,
      overall_score: row.startup_score?.overall_score ?? 0,
      confidence: row.confidence,
      recommendation: row.recommendation,
      memo_version: row.memo_version,
      created_at: row.created_at,
    }));
  }

  /**
   * Aggregate stats object for the dashboard / admin.
   */
  async getStats(): Promise<InvestmentMemoStats> {
    const { data, error } = await this.client.from(ENTITY).select("*");

    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as InvestmentMemoRow[];

    if (rows.length === 0) {
      return {
        total: 0,
        averageConfidence: 0,
        strongBuyCount: 0,
        investorReadyCount: 0,
        latestMemoDate: null,
      };
    }

    const sumConfidence = rows.reduce((acc, r) => acc + r.confidence, 0);
    const strongBuy = rows.filter((r) =>
      r.recommendation?.toUpperCase().startsWith("STRONG BUY"),
    ).length;
    const investorReady = rows.filter(
      (r) => r.recommendation?.toUpperCase() === "STRONG BUY",
    ).length;

    const latestDate = rows.reduce(
      (acc, row) => (row.created_at > (acc ?? "") ? row.created_at : acc),
      "" as string,
    );

    return {
      total: rows.length,
      averageConfidence: round2(sumConfidence / rows.length),
      strongBuyCount: strongBuy,
      investorReadyCount: investorReady,
      latestMemoDate: latestDate || null,
    };
  }

  /**
   * Confidence distribution: count of records bucketed by confidence range.
   */
  async getConfidenceDistribution(): Promise<
    Array<{ bucket: string; count: number; minConfidence: number; maxConfidence: number }>
  > {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("confidence");
    if (error) throw translateError(ENTITY, error);
    const confidences = ((data ?? []) as Array<{ confidence: number }>).map(
      (r) => r.confidence,
    );

    const buckets = [
      { bucket: "0-20", minConfidence: 0, maxConfidence: 20, count: 0 },
      { bucket: "21-40", minConfidence: 21, maxConfidence: 40, count: 0 },
      { bucket: "41-60", minConfidence: 41, maxConfidence: 60, count: 0 },
      { bucket: "61-80", minConfidence: 61, maxConfidence: 80, count: 0 },
      { bucket: "81-100", minConfidence: 81, maxConfidence: 100, count: 0 },
    ];

    for (const confidence of confidences) {
      const b = buckets.find(
        (b) => confidence >= b.minConfidence && confidence <= b.maxConfidence,
      );
      if (b) b.count++;
    }

    return buckets;
  }

  /**
   * Recommendation breakdown counts.
   */
  async getRecommendationBreakdown(): Promise<
    Array<{ recommendation: string; count: number }>
  > {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("recommendation");
    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as Array<{ recommendation: string | null }>;

    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = (row.recommendation ?? "Unknown").trim() || "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([recommendation, count]) => ({ recommendation, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Investment decision breakdown counts.
   */
  async getInvestmentDecisionBreakdown(): Promise<
    Array<{ decision: string; count: number }>
  > {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("investment_decision");
    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as Array<{ investment_decision: string | null }>;

    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = (row.investment_decision ?? "Unknown").trim() || "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([decision, count]) => ({ decision, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * History: group memos by date and compute avg confidence per day.
   */
  async getHistory(days: number = 30): Promise<
    Array<{ date: string; count: number; avgConfidence: number }>
  > {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("created_at, confidence")
      .gte(
        "created_at",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("created_at", { ascending: true });

    if (error) throw translateError(ENTITY, error);

    const byDate = new Map<string, { count: number; sum: number }>();
    for (const row of (data ?? []) as Array<{ created_at: string; confidence: number }>) {
      const date = row.created_at.slice(0, 10);
      const entry = byDate.get(date) ?? { count: 0, sum: 0 };
      entry.count++;
      entry.sum += row.confidence;
      byDate.set(date, entry);
    }

    return Array.from(byDate.entries())
      .map(([date, v]) => ({
        date,
        count: v.count,
        avgConfidence: round2(v.sum / v.count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Full-text + faceted search across memos.
   *
   * Strategy:
   * - `query`: ILIKE on title, thesis, market, problem, solution, strengths.
   *   Each searchable field is OR-ed via Supabase's `or` operator;
   *   top-level filters AND together with the query.
   * - `recommendation` / `investmentDecision`: exact match (case-insensitive).
   * - `minConfidence` / `maxConfidence`: range filter on confidence column.
   */
  async search(
    filters: InvestmentMemoSearchFilters,
  ): Promise<InvestmentMemoRow[]> {
    const {
      query,
      recommendation,
      minConfidence,
      maxConfidence,
      investmentDecision,
      limit = 50,
      offset = 0,
      orderBy = "created_at",
      ascending = false,
    } = filters;

    let q = this.client.from(ENTITY).select("*");

    if (recommendation) {
      q = q.ilike("recommendation", recommendation);
    }
    if (investmentDecision) {
      q = q.ilike("investment_decision", investmentDecision);
    }
    if (minConfidence !== undefined) {
      q = q.gte("confidence", minConfidence);
    }
    if (maxConfidence !== undefined) {
      q = q.lte("confidence", maxConfidence);
    }
    if (query && query.trim().length > 0) {
      const safe = query.trim().replace(/[\\%_]/g, (m) => `\\${m}`);
      const pattern = `%${safe}%`;
      const orFilter = [
        `title.ilike.${pattern}`,
        `thesis.ilike.${pattern}`,
        `market.ilike.${pattern}`,
        `problem.ilike.${pattern}`,
        `solution.ilike.${pattern}`,
        `strengths.ilike.${pattern}`,
      ].join(",");
      q = q.or(orFilter);
    }

    q = q.order(orderBy, { ascending }).range(offset, offset + limit - 1);

    const { data, error } = await q;
    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as InvestmentMemoRow[];
  }

  /**
   * Count results for the current search filters.
   * Useful for the dashboard search pagination.
   */
  async searchCount(filters: InvestmentMemoSearchFilters): Promise<number> {
    const {
      query,
      recommendation,
      minConfidence,
      maxConfidence,
      investmentDecision,
    } = filters;

    let q = this.client.from(ENTITY).select("id", { count: "exact", head: true });

    if (recommendation) {
      q = q.ilike("recommendation", recommendation);
    }
    if (investmentDecision) {
      q = q.ilike("investment_decision", investmentDecision);
    }
    if (minConfidence !== undefined) {
      q = q.gte("confidence", minConfidence);
    }
    if (maxConfidence !== undefined) {
      q = q.lte("confidence", maxConfidence);
    }
    if (query && query.trim().length > 0) {
      const safe = query.trim().replace(/[\\%_]/g, (m) => `\\${m}`);
      const pattern = `%${safe}%`;
      const orFilter = [
        `title.ilike.${pattern}`,
        `thesis.ilike.${pattern}`,
        `market.ilike.${pattern}`,
        `problem.ilike.${pattern}`,
        `solution.ilike.${pattern}`,
        `strengths.ilike.${pattern}`,
      ].join(",");
      q = q.or(orFilter);
    }

    const { count, error } = await q;
    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}