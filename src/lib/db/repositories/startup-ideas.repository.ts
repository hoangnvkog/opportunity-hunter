/**
 * Startup ideas repository.
 *
 * Spec note: no `created_at` and no `target_customer` columns.
 */

import type { StartupIdeaCardData } from "@/types/dashboard";
import type {
  StartupIdeaInsert,
  StartupIdeaRow,
  StartupIdeaUpdate,
  Uuid,
} from "@/types";
import { NotFoundError, RepositoryError, translateError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "startup_ideas";

export interface ListStartupIdeasOptions {
  opportunityId?: Uuid;
  limit?: number;
  offset?: number;
}

export class StartupIdeasRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<StartupIdeasRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new StartupIdeasRepository(await getSupabaseServerClient());
  }

  async findById(id: Uuid): Promise<StartupIdeaRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async findByIdOrThrow(id: Uuid): Promise<StartupIdeaRow> {
    const row = await this.findById(id);
    if (!row) throw new NotFoundError(ENTITY, id);
    return row;
  }

  async list(opts: ListStartupIdeasOptions = {}): Promise<StartupIdeaRow[]> {
    const { opportunityId, limit = 50, offset = 0 } = opts;

    let query = this.client
      .from(ENTITY)
      .select("*")
      .range(offset, offset + limit - 1);

    if (opportunityId !== undefined) query = query.eq("opportunity_id", opportunityId);

    const { data, error } = await query;

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async create(input: StartupIdeaInsert): Promise<StartupIdeaRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(input)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} insert returned no row`);
    return data;
  }

  async update(id: Uuid, patch: StartupIdeaUpdate): Promise<StartupIdeaRow> {
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

  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  async listLatest(limit = 10): Promise<StartupIdeaCardData[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select(`
        id,
        problem,
        solution,
        mvp,
        pricing,
        created_at,
        opportunities!inner(
          score,
          pain_clusters!inner(
            name,
            description
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);

    return (data ?? []).map((row: unknown) => {
      const r = row as {
        id: string;
        problem: string;
        solution: string;
        mvp: string;
        pricing: string;
        created_at: string;
        opportunities: {
          score: number;
          pain_clusters: {
            name: string;
            description: string;
          };
        };
      };
      return {
        id: r.id,
        problem: r.problem,
        solution: r.solution,
        mvp: r.mvp,
        pricing: r.pricing,
        score: r.opportunities.score,
        cluster_name: r.opportunities.pain_clusters.name,
        cluster_description: r.opportunities.pain_clusters.description,
        created_at: r.created_at,
      };
    });
  }

  async search(filters: import("@/types/filters").StartupIdeaFilters): Promise<StartupIdeaCardData[]> {
    const { search, limit = 10 } = filters;

    let query = this.client
      .from(ENTITY)
      .select(`
        id,
        problem,
        solution,
        mvp,
        pricing,
        created_at,
        opportunities!inner(
          score,
          pain_clusters!inner(
            name,
            description
          )
        )
      `)
      .order("created_at", { ascending: false });

    // Text search on problem, solution, or cluster name
    if (search && search.trim()) {
      query = query.or(`problem.ilike.%${search}%,solution.ilike.%${search}%`);
      // Note: Supabase doesn't support nested or on joined tables directly,
      // so cluster name search would need post-filtering or a different approach
    }

    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);

    let results = (data ?? []).map((row: unknown) => {
      const r = row as {
        id: string;
        problem: string;
        solution: string;
        mvp: string;
        pricing: string;
        created_at: string;
        opportunities: {
          score: number;
          pain_clusters: {
            name: string;
            description: string;
          };
        };
      };
      return {
        id: r.id,
        problem: r.problem,
        solution: r.solution,
        mvp: r.mvp,
        pricing: r.pricing,
        score: r.opportunities.score,
        cluster_name: r.opportunities.pain_clusters.name,
        cluster_description: r.opportunities.pain_clusters.description,
        created_at: r.created_at,
      };
    });

    // Post-filter for cluster name search if needed
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (idea) =>
          idea.problem.toLowerCase().includes(searchLower) ||
          idea.solution.toLowerCase().includes(searchLower) ||
          idea.cluster_name.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  async delete(id: Uuid): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }

  async findDetailById(
    id: Uuid,
  ): Promise<import("@/types/startup-idea-detail").StartupIdeaDetail | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select(`
        id,
        problem,
        solution,
        mvp,
        pricing,
        customer,
        distribution,
        competitors,
        created_at,
        opportunities!inner(
          score,
          pain_clusters!inner(
            name,
            description
          )
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    if (!data) return null;

    const row = data as unknown as {
      id: string;
      problem: string;
      solution: string;
      mvp: string;
      pricing: string;
      customer: string | null;
      distribution: string | null;
      competitors: string | null;
      created_at: string;
      opportunities: {
        score: import("@/types").Decimal6;
        pain_clusters: {
          name: string;
          description: string;
        };
      };
    };

    return {
      id: row.id,
      problem: row.problem,
      solution: row.solution,
      mvp: row.mvp,
      pricing: row.pricing,
      customer: row.customer,
      distribution: row.distribution,
      competitors: row.competitors,
      created_at: row.created_at,
      opportunity_score: Number(row.opportunities.score),
      cluster_name: row.opportunities.pain_clusters.name,
      cluster_description: row.opportunities.pain_clusters.description,
    };
  }
}
