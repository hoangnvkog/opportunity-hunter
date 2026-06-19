/**
 * Raw posts repository.
 *
 * Spec note: `raw_posts.source` is a free-form string (the source name),
 * not a FK to `sources.id`. Filtering by source is therefore an equality
 * match on a text column, not a join.
 */

import type {
  RawPostInsert,
  RawPostRow,
  RawPostUpdate,
  Uuid,
} from "@/types";
import { NotFoundError, RepositoryError, translateError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "raw_posts";

export interface ListRawPostsOptions {
  source?: string;
  minScore?: number;
  limit?: number;
  offset?: number;
}

export class RawPostsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<RawPostsRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new RawPostsRepository(await getSupabaseServerClient());
  }

  async findById(id: Uuid): Promise<RawPostRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async findByIdOrThrow(id: Uuid): Promise<RawPostRow> {
    const row = await this.findById(id);
    if (!row) throw new NotFoundError(ENTITY, id);
    return row;
  }

  async list(opts: ListRawPostsOptions = {}): Promise<RawPostRow[]> {
    const { source, minScore, limit = 50, offset = 0 } = opts;

    let query = this.client
      .from(ENTITY)
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (source !== undefined) query = query.eq("source", source);
    if (minScore !== undefined) query = query.gte("score", minScore);

    const { data, error } = await query;

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async listBySource(source: string, limit = 50): Promise<RawPostRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("source", source)
      .order("score", { ascending: false })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async create(input: RawPostInsert): Promise<RawPostRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(input)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} insert returned no row`);
    return data;
  }

  async createMany(inputs: RawPostInsert[]): Promise<RawPostRow[]> {
    if (inputs.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(inputs)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async update(id: Uuid, patch: RawPostUpdate): Promise<RawPostRow> {
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

  async listUnprocessed(limit = 50): Promise<RawPostRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  async markProcessed(id: Uuid): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .update({ processed: true })
      .eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }

  async markProcessedMany(ids: Uuid[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await this.client
      .from(ENTITY)
      .update({ processed: true })
      .in("id", ids);

    if (error) throw translateError(ENTITY, error);
  }

  async delete(id: Uuid): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }
}
