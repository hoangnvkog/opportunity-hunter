/**
 * Sources repository.
 */

import type {
  SourceInsert,
  SourceRow,
  SourceUpdate,
  Uuid,
} from "@/types";
import { NotFoundError, RepositoryError, translateError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "sources";

export class SourcesRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<SourcesRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new SourcesRepository(await getSupabaseServerClient());
  }

  async findById(id: Uuid): Promise<SourceRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async findByIdOrThrow(id: Uuid): Promise<SourceRow> {
    const row = await this.findById(id);
    if (!row) throw new NotFoundError(ENTITY, id);
    return row;
  }

  async findByName(name: string): Promise<SourceRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("name", name)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async listAll(): Promise<SourceRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async listByType(type: string): Promise<SourceRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async create(input: SourceInsert): Promise<SourceRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(input)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} insert returned no row`);
    return data;
  }

  async update(id: Uuid, patch: SourceUpdate): Promise<SourceRow> {
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
