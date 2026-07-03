/**
 * Venture GTM Repository (Sprint 63).
 *
 * CRUD operations for venture_gtm table.
 * Stores AI-generated Go-to-Market strategy for a venture project.
 */

import type {
  VentureGtmInsert,
  VentureGtmRow,
} from "@/types/venture-studio";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "venture_gtm";

export type { VentureGtmRow, VentureGtmInsert };

export class VentureGtmRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<VentureGtmRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new VentureGtmRepository(
      await getSupabaseServerClient(),
    );
  }

  /** Insert a single venture GTM record. */
  async create(record: VentureGtmInsert): Promise<VentureGtmRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert([record] as never)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as VentureGtmRow;
  }

  /** Find GTM for a venture project. */
  async findByProject(ventureProjectId: string): Promise<VentureGtmRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("venture_project_id", ventureProjectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as VentureGtmRow | null;
  }

  /** Delete GTM for a venture project. */
  async deleteByProject(ventureProjectId: string): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("venture_project_id", ventureProjectId);

    if (error) throw translateError(ENTITY, error);
  }

  /** Count of GTM records. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }
}
