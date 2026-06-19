/**
 * Pain clusters repository.
 *
 * Spec note: no `created_at` column, so no time-ordering methods.
 */

import type {
  PainClusterInsert,
  PainClusterRow,
  PainClusterUpdate,
  Uuid,
} from "@/types";
import { NotFoundError, RepositoryError, translateError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "pain_clusters";

export class PainClustersRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<PainClustersRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new PainClustersRepository(await getSupabaseServerClient());
  }

  async findById(id: Uuid): Promise<PainClusterRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async findByIdOrThrow(id: Uuid): Promise<PainClusterRow> {
    const row = await this.findById(id);
    if (!row) throw new NotFoundError(ENTITY, id);
    return row;
  }

  async findByName(name: string): Promise<PainClusterRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("name", name)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async listAll(): Promise<PainClusterRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*");

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

  async listTop(limit = 10): Promise<PainClusterRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .order("id", { ascending: false })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async listUnprocessedForOpportunities(limit = 50): Promise<PainClusterRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_generated", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async markOpportunityGenerated(id: Uuid): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .update({ opportunity_generated: true })
      .eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }

  async create(input: PainClusterInsert): Promise<PainClusterRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(input)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} insert returned no row`);
    return data;
  }

  async update(id: Uuid, patch: PainClusterUpdate): Promise<PainClusterRow> {
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
