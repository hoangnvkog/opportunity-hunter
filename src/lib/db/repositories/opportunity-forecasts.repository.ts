/**
 * Opportunity Forecast Repository (Sprint 54).
 *
 * CRUD operations for opportunity_forecasts table.
 */

import type {
  OpportunityForecastRow,
  OpportunityForecastInsert,
  OpportunityForecastUpdate,
} from "@/types/forecast";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/errors";

const ENTITY = "opportunity_forecasts";

export type {
  OpportunityForecastRow,
  OpportunityForecastInsert,
  OpportunityForecastUpdate,
};

export class OpportunityForecastsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<OpportunityForecastsRepository> {
    return new OpportunityForecastsRepository(getSupabaseServiceClient());
  }

  /** Insert a single forecast record. */
  async create(
    record: OpportunityForecastInsert,
  ): Promise<OpportunityForecastRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(record)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as OpportunityForecastRow;
  }

  /** Insert multiple forecast records. */
  async createMany(
    records: OpportunityForecastInsert[],
  ): Promise<OpportunityForecastRow[]> {
    if (records.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(records)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as OpportunityForecastRow[];
  }

  /** Find forecast by opportunity ID. */
  async findByOpportunity(
    opportunityId: string,
  ): Promise<OpportunityForecastRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as OpportunityForecastRow | null;
  }

  /** List all forecasts with pagination and sorting. */
  async list(
    opts: {
      limit?: number;
      offset?: number;
      minScore?: number;
      orderBy?:
        | "forecast_score"
        | "growth_probability"
        | "momentum"
        | "created_at";
      ascending?: boolean;
    } = {},
  ): Promise<OpportunityForecastRow[]> {
    const {
      limit = 50,
      offset = 0,
      minScore,
      orderBy = "forecast_score",
      ascending = false,
    } = opts;

    let query = this.client.from(ENTITY).select("*");

    if (minScore !== undefined) {
      query = query.gte("forecast_score", minScore);
    }

    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as OpportunityForecastRow[];
  }

  /** Get top forecasts by score. */
  async listTopForecasts(
    limit: number = 10,
  ): Promise<OpportunityForecastRow[]> {
    return this.list({ limit, orderBy: "forecast_score", ascending: false });
  }

  /** Delete all forecasts for an opportunity. */
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

  /** Total forecast count. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Average forecast score across all forecasts. */
  async averageForecastScore(): Promise<number> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("forecast_score, growth_probability, confidence, momentum");

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, row) => acc + row.forecast_score, 0);
    return Math.round((sum / data.length) * 100) / 100;
  }

  /** Average growth probability across all forecasts. */
  async averageGrowthProbability(): Promise<number> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("growth_probability");

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, row) => acc + row.growth_probability, 0);
    return Math.round((sum / data.length) * 100) / 100;
  }

  /** Average confidence across all forecasts. */
  async averageConfidence(): Promise<number> {
    const { data, error } = await this.client.from(ENTITY).select("confidence");

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, row) => acc + row.confidence, 0);
    return Math.round((sum / data.length) * 100) / 100;
  }

  /** Average momentum across all forecasts. */
  async averageMomentum(): Promise<number> {
    const { data, error } = await this.client.from(ENTITY).select("momentum");

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, row) => acc + row.momentum, 0);
    return Math.round((sum / data.length) * 100) / 100;
  }

  /** Maximum forecast score (top forecast). */
  async topForecastScore(): Promise<number> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("forecast_score")
      .order("forecast_score", { ascending: false })
      .limit(1);

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;
    return data[0].forecast_score;
  }

  /** Get full stats object. */
  async getStats(): Promise<{
    total: number;
    averageForecastScore: number;
    averageGrowthProbability: number;
    averageConfidence: number;
    averageMomentum: number;
    topForecastScore: number;
  }> {
    const [total, avgScore, avgGrowth, avgConfidence, avgMomentum, topScore] =
      await Promise.all([
        this.count(),
        this.averageForecastScore(),
        this.averageGrowthProbability(),
        this.averageConfidence(),
        this.averageMomentum(),
        this.topForecastScore(),
      ]);

    return {
      total,
      averageForecastScore: avgScore,
      averageGrowthProbability: avgGrowth,
      averageConfidence: avgConfidence,
      averageMomentum: avgMomentum,
      topForecastScore: topScore,
    };
  }
}
