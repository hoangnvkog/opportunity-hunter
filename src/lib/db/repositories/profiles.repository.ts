/**
 * Profiles repository.
 */

import type { ProfileInsert, ProfileRow, ProfileUpdate, Uuid } from "@/types";
import { NotFoundError, RepositoryError, translateError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "profiles";

export class ProfilesRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<ProfilesRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new ProfilesRepository(await getSupabaseServerClient());
  }

  async findById(id: Uuid): Promise<ProfileRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async findByIdOrThrow(id: Uuid): Promise<ProfileRow> {
    const row = await this.findById(id);
    if (!row) throw new NotFoundError(ENTITY, id);
    return row;
  }

  async findByEmail(email: string): Promise<ProfileRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  async create(input: ProfileInsert): Promise<ProfileRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(input)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} insert returned no row`);
    return data;
  }

  async update(id: Uuid, patch: ProfileUpdate): Promise<ProfileRow> {
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

  async findAll(): Promise<ProfileRow[]> {
    const { data, error } = await this.client.from(ENTITY).select("*");
    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async delete(id: Uuid): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }
}
