/**
 * Pain points repository.
 */

import type {
  PainPointInsert,
  PainPointRow,
  PainPointUpdate,
  Uuid,
} from "@/types";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  NotFoundError,
  RepositoryError,
  translateError,
} from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "pain_points";

export interface ListPainPointsOptions {
  minSeverity?: number;
  minFrequency?: number;
  minBuyingIntent?: number;
  limit?: number;
  offset?: number;
}

export class PainPointsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<PainPointsRepository> {
    return new PainPointsRepository(getSupabaseServiceClient());
  }

  async findById(id: Uuid): Promise<PainPointRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async findByIdOrThrow(id: Uuid): Promise<PainPointRow> {
    const row = await this.findById(id);
    if (!row) throw new NotFoundError(ENTITY, id);
    return row;
  }

  async list(opts: ListPainPointsOptions = {}): Promise<PainPointRow[]> {
    const {
      minSeverity,
      minFrequency,
      minBuyingIntent,
      limit = 50,
      offset = 0,
    } = opts;

    let query = this.client
      .from(ENTITY)
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (minSeverity !== undefined) query = query.gte("severity", minSeverity);
    if (minFrequency !== undefined)
      query = query.gte("frequency", minFrequency);
    if (minBuyingIntent !== undefined)
      query = query.gte("buying_intent", minBuyingIntent);

    const { data, error } = await query;

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async create(input: PainPointInsert): Promise<PainPointRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(input)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} insert returned no row`);
    return data;
  }

  async createMany(inputs: PainPointInsert[]): Promise<PainPointRow[]> {
    if (inputs.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(inputs)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async update(id: Uuid, patch: PainPointUpdate): Promise<PainPointRow> {
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

  async listUnclustered(limit = 50): Promise<PainPointRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("clustered", false)
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

  async markClustered(id: Uuid): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .update({ clustered: true })
      .eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }

  async markClusteredMany(ids: Uuid[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await this.client
      .from(ENTITY)
      .update({ clustered: true })
      .in("id", ids);

    if (error) throw translateError(ENTITY, error);
  }

  async delete(id: Uuid): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }
}
