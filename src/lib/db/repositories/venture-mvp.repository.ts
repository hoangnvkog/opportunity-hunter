/**
 * Venture MVP Repository (Sprint 63).
 *
 * CRUD operations for venture_mvp table.
 * Stores AI-generated MVP plan for a venture project.
 */

import type {
  VentureMvpInsert,
  VentureMvpRow,
} from "@/types/venture-studio";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "venture_mvp";

export type { VentureMvpRow, VentureMvpInsert };

export class VentureMvpRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<VentureMvpRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new VentureMvpRepository(
      await getSupabaseServerClient(),
    );
  }

  /** Insert a single venture MVP record. */
  async create(record: VentureMvpInsert): Promise<VentureMvpRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert([record] as never)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as VentureMvpRow;
  }

  /** Find MVP for a venture project. */
  async findByProject(ventureProjectId: string): Promise<VentureMvpRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("venture_project_id", ventureProjectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as VentureMvpRow | null;
  }

  /** Delete MVP for a venture project. */
  async deleteByProject(ventureProjectId: string): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("venture_project_id", ventureProjectId);

    if (error) throw translateError(ENTITY, error);
  }

  /** Count of MVP records. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }
}
