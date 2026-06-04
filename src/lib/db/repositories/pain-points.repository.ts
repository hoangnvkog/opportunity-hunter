/**
 * Pain points repository.
 */

import type {
  PainPointInsert,
  PainPointRow,
  PainPointUpdate,
  Uuid,
} from "@/types";
import { NotFoundError, RepositoryError, translateError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "pain_points";

export interface ListPainPointsOptions {
  rawPostId?: Uuid;
  category?: string;
  minSeverity?: number;
  minBuyingIntent?: number;
  limit?: number;
  offset?: number;
}

export class PainPointsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<PainPointsRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new PainPointsRepository(await getSupabaseServerClient());
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
      rawPostId,
      category,
      minSeverity,
      minBuyingIntent,
      limit = 50,
      offset = 0,
    } = opts;

    let query = this.client
      .from(ENTITY)
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (rawPostId !== undefined) query = query.eq("raw_post_id", rawPostId);
    if (category !== undefined) query = query.eq("category", category);
    if (minSeverity !== undefined)
      query = query.gte("severity", minSeverity);
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

  async delete(id: Uuid): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }
}
