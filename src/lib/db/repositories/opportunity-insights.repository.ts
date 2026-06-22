/**
 * Sprint 46: Repository for opportunity_insights.
 *
 * Spec note:
 *   - One insight per opportunity (UNIQUE constraint at the SQL layer).
 *   - Reads are RLS-gated by the schema.
 *   - Inserts are idempotent for the same `opportunity_id` — calling
 *     `create()` twice for the same opportunity returns the existing
 *     row (so re-running the AI step never duplicates data).
 */

import { translateError, NotFoundError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import type {
  OpportunityInsightFilters,
  OpportunityInsightInsert,
  OpportunityInsightRow,
} from "@/types/opportunity-insight";
import type {
  CompetitionLevel,
  Urgency,
} from "@/types/opportunity-insight";
import type { Uuid } from "@/types";

const ENTITY = "opportunity_insights";

export class OpportunityInsightsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<OpportunityInsightsRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new OpportunityInsightsRepository(await getSupabaseServerClient());
  }

  /**
   * Insert a new insight row for `opportunity_id`. Idempotent: when a
   * row already exists (23505 unique violation) we return it so callers
   * can safely re-run AI generation on the same target.
   */
  async create(data: OpportunityInsightInsert): Promise<OpportunityInsightRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .insert(data)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const existing = await this.findByOpportunityId(data.opportunity_id);
        if (existing) return existing;
      }
      throw translateError(ENTITY, error);
    }

    if (!row) throw new NotFoundError(ENTITY, data.opportunity_id);
    return row as OpportunityInsightRow;
  }

  /**
   * Look up the single insight for an opportunity (or null).
   */
  async findByOpportunityId(opportunityId: Uuid): Promise<OpportunityInsightRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return (data ?? null) as OpportunityInsightRow | null;
  }

  /**
   * Read the insight joined with the parent opportunity + cluster, so
   * callers can render cards without a second query.
   * Returns null when no insight exists yet.
   */
  async findCardByOpportunityId(opportunityId: Uuid): Promise<
    (OpportunityInsightRow & {
      opportunity_title: string;
      opportunity_score: number;
    }) | null
  > {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*, opportunity:opportunities(id, score, pain_clusters!inner(name))")
      .eq("opportunity_id", opportunityId)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    if (!data) return null;

    const opportunity = (data as unknown as {
      opportunity?: { score: number; pain_clusters: { name: string } };
    }).opportunity;
    return {
      ...(data as OpportunityInsightRow),
      opportunity_title: opportunity?.pain_clusters?.name ?? "Untitled opportunity",
      opportunity_score: opportunity?.score ?? 0,
    };
  }

  /**
   * List insights for the `/insights` history page.
   * Supports filtering on competition_level/urgency/minConfidence and sorting.
   */
  async listLatest(
    filters: OpportunityInsightFilters = {},
  ): Promise<Array<OpportunityInsightRow & {
    opportunity_title: string;
    opportunity_score: number;
  }>> {
    const {
      competition_level,
      urgency,
      minConfidence,
      sort = "created_at",
      order = "desc",
      limit = 50,
      offset = 0,
    } = filters;

    let query = this.client
      .from(ENTITY)
      .select("*, opportunity:opportunities(score, pain_clusters!inner(name))")
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (competition_level) {
      query = query.eq("competition_level", competition_level);
    }
    if (urgency) {
      query = query.eq("urgency", urgency);
    }
    if (minConfidence !== undefined) {
      query = query.gte("confidence_score", minConfidence);
    }

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);

    return ((data ?? []) as unknown as Array<
      OpportunityInsightRow & {
        opportunity: { score: number; pain_clusters: { name: string } };
      }
    >).map((row) => {
      const opp = (row as unknown as { opportunity?: { score: number; pain_clusters: { name: string } } })
        .opportunity;
      return {
        ...row,
        opportunity_title: opp?.pain_clusters?.name ?? "Untitled opportunity",
        opportunity_score: opp?.score ?? 0,
      };
    });
  }

  /**
   * Light-weight list of the most recent N insights (dashboard widget).
   */
  async listRecentCards(
    limit = 5,
  ): Promise<Array<OpportunityInsightRow & {
    opportunity_title: string;
    opportunity_score: number;
  }>> {
    return this.listLatest({ sort: "created_at", order: "desc", limit });
  }

  /**
   * Count insights after filters (used by history pagination).
   */
  async count(
    filters: Pick<OpportunityInsightFilters, "competition_level" | "urgency" | "minConfidence"> = {},
  ): Promise<number> {
    let query = this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });

    if (filters.competition_level) query = query.eq("competition_level", filters.competition_level);
    if (filters.urgency) query = query.eq("urgency", filters.urgency);
    if (filters.minConfidence !== undefined) {
      query = query.gte("confidence_score", filters.minConfidence);
    }

    const { count, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /**
   * Hard delete (admin / setting reset). Used by `delete()` in the spec.
   */
  async delete(opportunityId: Uuid): Promise<boolean> {
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("opportunity_id", opportunityId);

    if (error) throw translateError(ENTITY, error);
    return true;
  }

  /**
   * Aggregate counts by a single dimension, useful for filter UI labels.
   */
  async countByCompetition(): Promise<Record<CompetitionLevel, number>> {
    const result: Record<CompetitionLevel, number> = { Low: 0, Medium: 0, High: 0 };
    const { data, error } = await this.client
      .from(ENTITY)
      .select("competition_level");

    if (error) throw translateError(ENTITY, error);
    for (const row of (data ?? []) as Array<{ competition_level: CompetitionLevel }>) {
      result[row.competition_level] += 1;
    }
    return result;
  }

  async countByUrgency(): Promise<Record<Urgency, number>> {
    const result: Record<Urgency, number> = { Low: 0, Medium: 0, High: 0 };
    const { data, error } = await this.client
      .from(ENTITY)
      .select("urgency");

    if (error) throw translateError(ENTITY, error);
    for (const row of (data ?? []) as Array<{ urgency: Urgency }>) {
      result[row.urgency] += 1;
    }
    return result;
  }
}
