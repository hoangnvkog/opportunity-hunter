/**
 * Startup ideas repository.
 *
 * Spec note: no `created_at` and no `target_customer` columns.
 */

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

  async delete(id: Uuid): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }
}
