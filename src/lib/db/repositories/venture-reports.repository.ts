/**
 * Venture Reports Repository (Sprint 57).
 *
 * CRUD operations for venture_reports table.
 * Stores AI-generated venture research reports for investment-grade opportunities.
 */

import type {
  VentureReportInsert,
  VentureReportRow,
  VentureReportCardData,
  VentureReportStats,
} from "@/types/venture-report";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "venture_reports";

export type { VentureReportRow, VentureReportInsert };

/** Confidence threshold for investment-grade reports (matches Sprint 57 spec). */
export const INVESTMENT_GRADE_CONFIDENCE_THRESHOLD = 80;

export class VentureReportsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<VentureReportsRepository> {
    return new VentureReportsRepository(getSupabaseServiceClient());
  }

  /** Insert a single venture report record. */
  async create(record: VentureReportInsert): Promise<VentureReportRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert([record] as never)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as VentureReportRow;
  }

  /** Insert multiple venture report records. */
  async createMany(
    records: VentureReportInsert[],
  ): Promise<VentureReportRow[]> {
    if (records.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(records as never)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as VentureReportRow[];
  }

  /** Find latest venture report for an opportunity. */
  async findByOpportunity(
    opportunityId: string,
  ): Promise<VentureReportRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as VentureReportRow | null;
  }

  /** Alias for findByOpportunity (latest by created_at desc). */
  async findLatest(opportunityId: string): Promise<VentureReportRow | null> {
    return this.findByOpportunity(opportunityId);
  }

  /** List venture report rows with pagination. */
  async list(
    opts: {
      limit?: number;
      offset?: number;
      minConfidence?: number;
      orderBy?: "confidence" | "created_at" | "report_version";
      ascending?: boolean;
    } = {},
  ): Promise<VentureReportRow[]> {
    const {
      limit = 50,
      offset = 0,
      minConfidence,
      orderBy = "created_at",
      ascending = false,
    } = opts;

    let query = this.client.from(ENTITY).select("*");

    if (minConfidence !== undefined) {
      query = query.gte("confidence", minConfidence);
    }

    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as VentureReportRow[];
  }

  /** Total count of venture report records. */
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
    return Math.round((sum / rows.length) * 100) / 100;
  }

  /** Count of investment-grade records (confidence >= 80). */
  async investmentGradeCount(
    threshold: number = INVESTMENT_GRADE_CONFIDENCE_THRESHOLD,
  ): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true })
      .gte("confidence", threshold);

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
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

  /** Latest report creation date. */
  async latestReportDate(): Promise<string | null> {
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
   * List venture report records joined with opportunity + cluster + startup_score details.
   * Powers the dashboard table.
   */
  async listCards(
    opts: {
      limit?: number;
      offset?: number;
      minConfidence?: number;
    } = {},
  ): Promise<VentureReportCardData[]> {
    const { limit = 50, offset = 0, minConfidence } = opts;

    let query = this.client.from(ENTITY).select(
      `
        *,
        opportunity:opportunities(
          id,
          title,
          pain_cluster:pain_clusters(name)
        ),
        startup_score:startup_scores(overall_score, recommendation)
      `,
    );

    if (minConfidence !== undefined) {
      query = query.gte("confidence", minConfidence);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);

    type RawRow = VentureReportRow & {
      opportunity?: {
        id: string;
        title: string;
        pain_cluster?: { name: string } | null;
      } | null;
      startup_score?: {
        overall_score: number;
        recommendation: string | null;
      } | null;
    };

    const rows = (data ?? []) as RawRow[];

    return rows.map((row) => ({
      id: row.id,
      opportunity_id: row.opportunity_id,
      opportunity_title: row.opportunity?.title ?? "Unknown",
      cluster_name: row.opportunity?.pain_cluster?.name ?? null,
      overall_score: row.startup_score?.overall_score ?? 0,
      confidence: row.confidence,
      recommendation: row.startup_score?.recommendation ?? row.recommendation,
      report_version: row.report_version,
      created_at: row.created_at,
    }));
  }

  /**
   * Aggregate stats object for the dashboard/admin.
   */
  async getStats(): Promise<VentureReportStats> {
    const { data, error } = await this.client.from(ENTITY).select("*");

    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as VentureReportRow[];

    if (rows.length === 0) {
      return {
        total: 0,
        averageConfidence: 0,
        investmentGradeCount: 0,
        strongBuyCount: 0,
        latestReportDate: null,
      };
    }

    const sum = (key: keyof VentureReportRow): number =>
      rows.reduce((acc, row) => acc + (row[key] as number), 0);

    const investmentGrade = rows.filter(
      (r) => r.confidence >= INVESTMENT_GRADE_CONFIDENCE_THRESHOLD,
    ).length;

    const strongBuy = rows.filter((r) =>
      r.recommendation?.toUpperCase().startsWith("STRONG BUY"),
    ).length;

    const latestDate = rows.reduce(
      (acc, row) => (row.created_at > (acc ?? "") ? row.created_at : acc),
      "" as string,
    );

    return {
      total: rows.length,
      averageConfidence: round2(sum("confidence") / rows.length),
      investmentGradeCount: investmentGrade,
      strongBuyCount: strongBuy,
      latestReportDate: latestDate || null,
    };
  }

  /**
   * Confidence distribution: count of records bucketed by confidence range.
   */
  async getConfidenceDistribution(): Promise<
    Array<{
      bucket: string;
      count: number;
      minConfidence: number;
      maxConfidence: number;
    }>
  > {
    const { data, error } = await this.client.from(ENTITY).select("confidence");
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
   * History: group reports by date and compute avg confidence per day.
   */
  async getHistory(
    days: number = 30,
  ): Promise<Array<{ date: string; count: number; avgConfidence: number }>> {
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
    for (const row of (data ?? []) as Array<{
      created_at: string;
      confidence: number;
    }>) {
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
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
