/**
 * Startup Scores Repository (Sprint 56).
 *
 * CRUD operations for startup_scores table.
 * Stores VC-style due-diligence scores for validated opportunities.
 */

import type {
  StartupScoreInsert,
  StartupScoreRow,
  StartupScoreCardData,
} from "@/types/startup-score";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "startup_scores";

export type { StartupScoreRow, StartupScoreInsert };

/** Investment-grade threshold (matches Sprint 56 spec). */
export const INVESTMENT_GRADE_THRESHOLD = 90;

export class StartupScoresRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<StartupScoresRepository> {
    return new StartupScoresRepository(getSupabaseServiceClient());
  }

  /** Insert a single startup score record. */
  async create(record: StartupScoreInsert): Promise<StartupScoreRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(record)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as StartupScoreRow;
  }

  /** Insert multiple startup score records. */
  async createMany(records: StartupScoreInsert[]): Promise<StartupScoreRow[]> {
    if (records.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(records)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as StartupScoreRow[];
  }

  /** Find startup score record for an opportunity. */
  async findByOpportunity(
    opportunityId: string,
  ): Promise<StartupScoreRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as StartupScoreRow | null;
  }

  /** Delete all score records for an opportunity. */
  async deleteByOpportunity(opportunityId: string): Promise<number> {
    let beforeCount = 0;
    const { count } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true })
      .eq("opportunity_id", opportunityId);
    beforeCount = count ?? 0;

    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("opportunity_id", opportunityId);

    if (error) throw translateError(ENTITY, error);
    return beforeCount;
  }

  /** List startup score rows with pagination. */
  async list(
    opts: {
      limit?: number;
      offset?: number;
      minScore?: number;
      orderBy?: "overall_score" | "confidence" | "created_at" | "tam_score";
      ascending?: boolean;
    } = {},
  ): Promise<StartupScoreRow[]> {
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
    return (data ?? []) as StartupScoreRow[];
  }

  /** Top startup score records by overall_score. */
  async listTop(limit: number = 10): Promise<StartupScoreRow[]> {
    return this.list({ limit, orderBy: "overall_score", ascending: false });
  }

  /** Total count of startup score records. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Average overall_score across all startup score records. */
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
    const { data, error } = await this.client.from(ENTITY).select("confidence");

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, row) => acc + row.confidence, 0);
    return Math.round((sum / data.length) * 100) / 100;
  }

  /** Count of investment-grade records (overall_score >= 90). */
  async investmentGradeCount(
    threshold: number = INVESTMENT_GRADE_THRESHOLD,
  ): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true })
      .gte("overall_score", threshold);

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Find the opportunity_id with the highest overall_score. */
  async topOpportunityId(): Promise<string | null> {
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
   * List startup score records joined with opportunity + cluster details.
   * Powers the dashboard table.
   */
  async listCards(
    opts: {
      limit?: number;
      offset?: number;
      minScore?: number;
    } = {},
  ): Promise<StartupScoreCardData[]> {
    const { limit = 50, offset = 0, minScore } = opts;

    let query = this.client.from(ENTITY).select(
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

    type RawRow = StartupScoreRow & {
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
      tam_score: row.tam_score,
      market_timing_score: row.market_timing_score,
      competition_score: row.competition_score,
      moat_score: row.moat_score,
      distribution_score: row.distribution_score,
      execution_score: row.execution_score,
      capital_efficiency_score: row.capital_efficiency_score,
      overall_score: row.overall_score,
      confidence: row.confidence,
      recommendation: row.recommendation,
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
    investmentGradeCount: number;
    averageConfidence: number;
    averageTamScore: number;
    averageMarketTimingScore: number;
    averageCompetitionScore: number;
    averageMoatScore: number;
    averageDistributionScore: number;
    averageExecutionScore: number;
    averageCapitalEfficiencyScore: number;
  }> {
    const { data, error } = await this.client.from(ENTITY).select("*");

    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as StartupScoreRow[];

    if (rows.length === 0) {
      return {
        total: 0,
        averageOverallScore: 0,
        highestOverallScore: 0,
        investmentGradeCount: 0,
        averageConfidence: 0,
        averageTamScore: 0,
        averageMarketTimingScore: 0,
        averageCompetitionScore: 0,
        averageMoatScore: 0,
        averageDistributionScore: 0,
        averageExecutionScore: 0,
        averageCapitalEfficiencyScore: 0,
      };
    }

    const sum = (key: keyof StartupScoreRow): number =>
      rows.reduce((acc, row) => acc + (row[key] as number), 0);

    return {
      total: rows.length,
      averageOverallScore: round2(sum("overall_score") / rows.length),
      highestOverallScore: Math.max(...rows.map((r) => r.overall_score)),
      investmentGradeCount: rows.filter(
        (r) => r.overall_score >= INVESTMENT_GRADE_THRESHOLD,
      ).length,
      averageConfidence: round2(sum("confidence") / rows.length),
      averageTamScore: round2(sum("tam_score") / rows.length),
      averageMarketTimingScore: round2(
        sum("market_timing_score") / rows.length,
      ),
      averageCompetitionScore: round2(sum("competition_score") / rows.length),
      averageMoatScore: round2(sum("moat_score") / rows.length),
      averageDistributionScore: round2(sum("distribution_score") / rows.length),
      averageExecutionScore: round2(sum("execution_score") / rows.length),
      averageCapitalEfficiencyScore: round2(
        sum("capital_efficiency_score") / rows.length,
      ),
    };
  }

  /**
   * Average score per dimension (used for "Average by dimension" chart).
   */
  async getDimensionAverages(): Promise<
    Array<{ dimension: string; label: string; average: number }>
  > {
    const { data, error } = await this.client.from(ENTITY).select("*");
    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as StartupScoreRow[];
    if (rows.length === 0) {
      return [];
    }

    const dimensions: Array<{
      key: keyof StartupScoreRow;
      dimension: string;
      label: string;
    }> = [
      { key: "tam_score", dimension: "tam_score", label: "TAM" },
      {
        key: "market_timing_score",
        dimension: "market_timing_score",
        label: "Market Timing",
      },
      {
        key: "competition_score",
        dimension: "competition_score",
        label: "Competition",
      },
      { key: "moat_score", dimension: "moat_score", label: "Moat" },
      {
        key: "distribution_score",
        dimension: "distribution_score",
        label: "Distribution",
      },
      {
        key: "execution_score",
        dimension: "execution_score",
        label: "Execution",
      },
      {
        key: "capital_efficiency_score",
        dimension: "capital_efficiency_score",
        label: "Capital Efficiency",
      },
    ];

    return dimensions.map((d) => ({
      dimension: d.dimension,
      label: d.label,
      average: round2(
        rows.reduce((acc, row) => acc + (row[d.key] as number), 0) /
          rows.length,
      ),
    }));
  }

  /**
   * Recommendation breakdown counts (Strong Invest / Watch / Pass).
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
   * Score distribution: count of records bucketed by overall_score range.
   */
  async getScoreDistribution(): Promise<
    Array<{ bucket: string; count: number; minScore: number; maxScore: number }>
  > {
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
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
