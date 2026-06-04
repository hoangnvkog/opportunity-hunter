/**
 * Opportunities repository.
 *
 * Spec note: the score column is `score` (not `opportunity_score`) and
 * there is no `created_at` column.
 */

import type {
  OpportunityInsert,
  OpportunityRow,
  OpportunityUpdate,
  Uuid,
} from "@/types";
import { NotFoundError, RepositoryError, translateError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "opportunities";

export interface ListOpportunitiesOptions {
  clusterId?: Uuid;
  minScore?: number;
  limit?: number;
  offset?: number;
}

export class OpportunitiesRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<OpportunitiesRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new OpportunitiesRepository(await getSupabaseServerClient());
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

  async listTop(limit = 10): Promise<OpportunityRow[]> {
    return this.list({ limit });
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

  async delete(id: Uuid): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }
}
