/**
 * Opportunity Backtests Repository (Sprint 59).
 *
 * CRUD operations for opportunity_backtests table.
 * Tracks historical accuracy of investment predictions.
 */

import type {
  BacktestInsert,
  BacktestRow,
  BacktestUpdate,
  BacktestCard,
  BacktestStats,
  BacktestSearchFilters,
  BacktestAccuracyDistribution,
  BacktestStatus,
} from "@/types/backtesting";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "opportunity_backtests";

export type { BacktestRow, BacktestInsert, BacktestUpdate };

export class OpportunityBacktestsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<OpportunityBacktestsRepository> {
    return new OpportunityBacktestsRepository(getSupabaseServiceClient());
  }

  /** Insert a single backtest record. */
  async create(record: BacktestInsert): Promise<BacktestRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert([record] as never)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as BacktestRow;
  }

  /** Insert multiple backtest records. */
  async createMany(records: BacktestInsert[]): Promise<BacktestRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(records as never[])
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return data as BacktestRow[];
  }

  /** Find backtest by primary key. */
  async findById(id: string): Promise<BacktestRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as BacktestRow | null;
  }

  /** Find all backtests for an opportunity, sorted by evaluation_date desc. */
  async findByOpportunity(
    opportunityId: string,
    limit = 50,
  ): Promise<BacktestRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("evaluation_date", { ascending: false })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data as BacktestRow[];
  }

  /** Find the latest backtest for an opportunity. */
  async findLatest(opportunityId: string): Promise<BacktestRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("evaluation_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as BacktestRow | null;
  }

  /** List backtests with optional filters and pagination. */
  async list(filters: BacktestSearchFilters = {}): Promise<BacktestRow[]> {
    let query = this.client.from(ENTITY).select("*");

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.minAccuracy !== undefined) {
      query = query.gte("accuracy", filters.minAccuracy);
    }
    if (filters.maxAccuracy !== undefined) {
      query = query.lte("accuracy", filters.maxAccuracy);
    }
    if (filters.minDelta !== undefined) {
      query = query.gte("prediction_delta", filters.minDelta);
    }
    if (filters.maxDelta !== undefined) {
      query = query.lte("prediction_delta", filters.maxDelta);
    }

    const orderBy = filters.orderBy ?? "evaluation_date";
    const ascending = filters.ascending ?? false;
    query = query.order(orderBy, { ascending });

    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset)
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit ?? 50) - 1,
      );

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return data as BacktestRow[];
  }

  /** Count total backtests (optionally filtered). */
  async count(filters: { status?: BacktestStatus } = {}): Promise<number> {
    let query = this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });
    if (filters.status) query = query.eq("status", filters.status);
    const { count, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Update a backtest record (typically after evaluation). */
  async update(id: string, patch: BacktestUpdate): Promise<BacktestRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .update(patch as never)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as BacktestRow;
  }

  /** Get aggregated stats for the backtesting dashboard. */
  async getStats(): Promise<BacktestStats> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select(
        `id, accuracy, prediction_delta, status, evaluation_date, created_at`,
      );

    if (error) throw translateError(ENTITY, error);

    const rows = data as Array<{
      id: string;
      accuracy: string | null;
      prediction_delta: string | null;
      status: BacktestStatus;
      evaluation_date: string;
      created_at: string;
    }>;

    const evaluated = rows.filter(
      (r) => r.status === "evaluated" && r.accuracy !== null,
    );

    const avgAccuracy =
      evaluated.length > 0
        ? evaluated.reduce((sum, r) => sum + Number(r.accuracy), 0) /
          evaluated.length
        : null;

    const avgDelta =
      evaluated.length > 0
        ? evaluated.reduce(
            (sum, r) => sum + Math.abs(Number(r.prediction_delta ?? 0)),
            0,
          ) / evaluated.length
        : null;

    const successfulPredictions = evaluated.filter(
      (r) => Number(r.accuracy) >= 60,
    ).length;
    const failedPredictions = evaluated.filter(
      (r) => Number(r.accuracy) < 40,
    ).length;

    const accuracyValues = evaluated
      .map((r) => Number(r.accuracy))
      .filter((v) => !isNaN(v));

    return {
      total: rows.length,
      evaluated: evaluated.length,
      pending: rows.filter((r) => r.status === "pending").length,
      averageAccuracy:
        avgAccuracy !== null ? Math.round(avgAccuracy * 100) / 100 : null,
      averageDelta: avgDelta !== null ? Math.round(avgDelta * 100) / 100 : null,
      successfulPredictions,
      failedPredictions,
      bestAccuracy:
        accuracyValues.length > 0 ? Math.max(...accuracyValues) : null,
      worstAccuracy:
        accuracyValues.length > 0 ? Math.min(...accuracyValues) : null,
      latestEvaluationDate:
        evaluated.length > 0
          ? evaluated.sort(
              (a, b) =>
                new Date(b.evaluation_date).getTime() -
                new Date(a.evaluation_date).getTime(),
            )[0].evaluation_date
          : null,
    };
  }

  /** List card data with opportunity title and cluster name. */
  async listCards(
    filters: BacktestSearchFilters = {},
  ): Promise<BacktestCard[]> {
    let query = this.client
      .from(ENTITY)
      .select(
        `
        id,
        opportunity_id,
        predicted_score,
        actual_score,
        prediction_delta,
        accuracy,
        status,
        evaluation_date,
        created_at,
        opportunities!inner(title)
      `,
      )
      .order(filters.orderBy ?? "evaluation_date", {
        ascending: filters.ascending ?? false,
      });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.minAccuracy !== undefined) {
      query = query.gte("accuracy", filters.minAccuracy);
    }
    if (filters.maxAccuracy !== undefined) {
      query = query.lte("accuracy", filters.maxAccuracy);
    }

    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit ?? 50) - 1,
      );
    }

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);

    return (data as Array<Record<string, unknown>>).map((row) => {
      const opp = row.opportunities as Record<string, unknown> | null;
      return {
        id: row.id as string,
        opportunity_id: row.opportunity_id as string,
        opportunity_title: (opp?.title as string) ?? "(unknown opportunity)",
        cluster_name: null,
        predicted_score: Number(row.predicted_score),
        actual_score:
          row.actual_score !== null ? Number(row.actual_score) : null,
        prediction_delta:
          row.prediction_delta !== null ? Number(row.prediction_delta) : null,
        accuracy: row.accuracy !== null ? Number(row.accuracy) : null,
        status: row.status as BacktestStatus,
        evaluation_date: row.evaluation_date as string,
        created_at: row.created_at as string,
      };
    });
  }

  /** Get accuracy distribution for admin dashboard. */
  async getAccuracyDistribution(): Promise<BacktestAccuracyDistribution[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("accuracy")
      .not("accuracy", "is", null)
      .eq("status", "evaluated");

    if (error) throw translateError(ENTITY, error);

    const rows = data as Array<{ accuracy: string }>;
    const buckets: Record<string, number> = {
      "90-100": 0,
      "80-90": 0,
      "70-80": 0,
      "60-70": 0,
      "40-60": 0,
      "20-40": 0,
      "0-20": 0,
    };

    for (const row of rows) {
      const a = Number(row.accuracy);
      if (a >= 90) buckets["90-100"]++;
      else if (a >= 80) buckets["80-90"]++;
      else if (a >= 70) buckets["70-80"]++;
      else if (a >= 60) buckets["60-70"]++;
      else if (a >= 40) buckets["40-60"]++;
      else if (a >= 20) buckets["20-40"]++;
      else buckets["0-20"]++;
    }

    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }

  /** Find pending backtests ready for evaluation. */
  async findPending(limit = 50): Promise<BacktestRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("status", "pending")
      .order("evaluation_date", { ascending: true })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data as BacktestRow[];
  }

  /** Upsert a backtest (idempotent: insert or update on opportunity_id + evaluation_date). */
  async upsert(record: BacktestInsert): Promise<BacktestRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .upsert([record] as never, {
        onConflict: "opportunity_id,evaluation_date",
        ignoreDuplicates: true,
      })
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as BacktestRow;
  }

  /** Delete by id. */
  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);
    if (error) throw translateError(ENTITY, error);
  }
}
