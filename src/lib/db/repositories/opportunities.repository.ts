/**
 * Opportunities repository.
 *
 * Spec note: the score column is `score` (not `opportunity_score`) and
 * there is no `created_at` column.
 */

import type { OpportunityCardData } from "@/types/dashboard";
import type {
  OpportunityInsert,
  OpportunityRow,
  OpportunityUpdate,
  Uuid,
} from "@/types";
import { NotFoundError, RepositoryError, translateError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "opportunities";

/**
 * Joined shape returned from ``opportunities`` with ``pain_clusters``.
 * The cluster is wrapped as a single object (PostgREST `!inner` join).
 */
export interface OpportunityWithCluster {
  id: Uuid;
  cluster_id: Uuid;
  title: string;
  description: string;
  score: number;
  frequency: number;
  severity: number;
  buying_intent: number;
  cluster_size: number | null;
  recency_score: string | null;
  source_diversity: string | null;
  created_at: string;
  pain_clusters: {
    id: Uuid;
    name: string;
    description: string;
  };
}

/** Single-row projection used for category aggregation. */
export interface OpportunityClusterNameOnly {
  pain_clusters: {
    name: string;
  };
}

export interface ListOpportunitiesOptions {
  clusterId?: Uuid;
  minScore?: number;
  limit?: number;
  offset?: number;
}

export interface FindManyOptions {
  limit?: number;
  offset?: number;
  category?: string;
  minScore?: number;
}

export class OpportunitiesRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<OpportunitiesRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new OpportunitiesRepository(await getSupabaseServerClient());
  }

  async findByIds(ids: Uuid[]): Promise<OpportunityRow[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .in("id", ids);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async findById(id: Uuid): Promise<OpportunityRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async findByIdOrThrow(id: Uuid): Promise<OpportunityRow> {
    const row = await this.findById(id);
    if (!row) throw new NotFoundError(ENTITY, id);
    return row;
  }

  async list(opts: ListOpportunitiesOptions = {}): Promise<OpportunityRow[]> {
    const { clusterId, minScore, limit = 50, offset = 0 } = opts;

    let query = this.client
      .from(ENTITY)
      .select("*")
      .order("score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (clusterId !== undefined) query = query.eq("cluster_id", clusterId);
    if (minScore !== undefined) query = query.gte("score", minScore);

    const { data, error } = await query;

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async listTop(limit = 10): Promise<OpportunityCardData[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("id, score, frequency, severity, buying_intent, source_diversity, recency_score, pain_clusters!inner(name, description)")
      .order("score", { ascending: false })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);

    return (data ?? []).map((row: unknown) => {
      const r = row as {
        id: string;
        score: number;
        frequency: number;
        severity: number;
        buying_intent: number;
        source_diversity: string | null;
        recency_score: string | null;
        pain_clusters: { name: string; description: string };
      };
      return {
        id: r.id,
        score: r.score,
        frequency: r.frequency,
        severity: r.severity,
        buying_intent: r.buying_intent,
        source_diversity: r.source_diversity ? parseFloat(r.source_diversity) : 0,
        recency_score: r.recency_score ? parseFloat(r.recency_score) : 0,
        cluster_name: r.pain_clusters.name,
        cluster_description: r.pain_clusters.description,
      };
    });
  }

  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  async listTopWithCluster(
    limit = 50,
  ): Promise<OpportunityWithCluster[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*, pain_clusters!inner(id, name, description)")
      .order("score", { ascending: false })
      .range(0, limit - 1);

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as unknown as OpportunityWithCluster[];
  }

  async findMany(
    filters: FindManyOptions = {},
  ): Promise<OpportunityWithCluster[]> {
    const { limit = 50, offset = 0, category, minScore } = filters;

    let query = this.client
      .from(ENTITY)
      .select("*, pain_clusters!inner(id, name, description)")
      .order("score", { ascending: false });

    if (category) {
      query = query.eq("pain_clusters.name", category);
    }

    if (minScore !== undefined) {
      query = query.gte("score", minScore);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as unknown as OpportunityWithCluster[];
  }

  async findByIdWithCluster(
    id: Uuid,
  ): Promise<OpportunityWithCluster | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*, pain_clusters!inner(id, name, description)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return (data ?? null) as unknown as OpportunityWithCluster | null;
  }

  /**
   * Find a single opportunity joined with its pain cluster, and count
   * the number of linked startup ideas. Returns the full
   * `OpportunityDetail` shape or `null` if not found.
   */
  async findDetailById(
    id: Uuid,
  ): Promise<import("@/types").OpportunityDetail | null> {
    const row = await this.findByIdWithCluster(id);
    if (!row) return null;

    // Count startup ideas for this opportunity
    const { count, error: countError } = await this.client
      .from("startup_ideas")
      .select("id", { count: "exact", head: true })
      .eq("opportunity_id", id);

    if (countError) throw translateError("startup_ideas", countError);

    return {
      id: row.id,
      score: row.score,
      frequency: row.frequency,
      severity: row.severity,
      buying_intent: row.buying_intent,
      cluster_name: row.pain_clusters.name,
      cluster_description: row.pain_clusters.description,
      startup_ideas_count: count ?? 0,
    };
  }

  async countByClusterName(
    categories: readonly string[],
  ): Promise<Map<string, number>> {
    if (categories.length === 0) return new Map();

    const { data, error } = await this.client
      .from(ENTITY)
      .select("pain_clusters!inner(name)")
      .in("pain_clusters.name", [...categories]);

    if (error) throw translateError(ENTITY, error);

    const counts = new Map<string, number>();
    for (const category of categories) counts.set(category, 0);
    for (const row of (data ?? []) as unknown as OpportunityClusterNameOnly[]) {
      const name = row.pain_clusters.name;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return counts;
  }

  async listUnprocessedForIdeas(limit = 50): Promise<OpportunityRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("idea_generated", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async markIdeaGenerated(id: Uuid): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .update({ idea_generated: true })
      .eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }

  async create(input: OpportunityInsert): Promise<OpportunityRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(input)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} insert returned no row`);
    return data;
  }

  async update(id: Uuid, patch: OpportunityUpdate): Promise<OpportunityRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") throw new NotFoundError(ENTITY, id);
      throw translateError(ENTITY, error);
    }
    if (!data) throw new RepositoryError(`${ENTITY} update returned no row`);
    return data;
  }

  async search(filters: import("@/types/filters").OpportunityFilters): Promise<OpportunityCardData[]> {
    const { search, minScore, minFrequency, minSeverity, minBuyingIntent, limit = 10 } = filters;

    let query = this.client
      .from(ENTITY)
      .select("id, score, frequency, severity, buying_intent, source_diversity, recency_score, pain_clusters!inner(name, description)")
      .order("score", { ascending: false });

    // Text search on cluster name or description
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`, { referencedTable: "pain_clusters" });
    }

    // Numeric filters
    if (minScore !== undefined) query = query.gte("score", minScore);
    if (minFrequency !== undefined) query = query.gte("frequency", minFrequency);
    if (minSeverity !== undefined) query = query.gte("severity", minSeverity);
    if (minBuyingIntent !== undefined) query = query.gte("buying_intent", minBuyingIntent);

    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);

    return (data ?? []).map((row: unknown) => {
      const r = row as {
        id: string;
        score: number;
        frequency: number;
        severity: number;
        buying_intent: number;
        source_diversity: string | null;
        recency_score: string | null;
        pain_clusters: { name: string; description: string };
      };
      return {
        id: r.id,
        score: r.score,
        frequency: r.frequency,
        severity: r.severity,
        buying_intent: r.buying_intent,
        source_diversity: r.source_diversity ? parseFloat(r.source_diversity) : 0,
        recency_score: r.recency_score ? parseFloat(r.recency_score) : 0,
        cluster_name: r.pain_clusters.name,
        cluster_description: r.pain_clusters.description,
      };
    });
  }

  async delete(id: Uuid): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }
}
