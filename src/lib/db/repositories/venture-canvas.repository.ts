/**
 * Venture Canvas Repository (Sprint 63).
 *
 * CRUD operations for venture_canvas table.
 * Stores AI-generated Business Model Canvas + Lean Canvas for a venture project.
 */

import type {
  VentureCanvasInsert,
  VentureCanvasRow,
} from "@/types/venture-studio";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "venture_canvas";

export type { VentureCanvasRow, VentureCanvasInsert };

export class VentureCanvasRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<VentureCanvasRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new VentureCanvasRepository(
      await getSupabaseServerClient(),
    );
  }

  /** Insert a single venture canvas record. */
  async create(record: VentureCanvasInsert): Promise<VentureCanvasRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert([record] as never)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as VentureCanvasRow;
  }

  /** Find canvas for a venture project. */
  async findByProject(ventureProjectId: string): Promise<VentureCanvasRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("venture_project_id", ventureProjectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as VentureCanvasRow | null;
  }

  /** Delete canvas for a venture project. */
  async deleteByProject(ventureProjectId: string): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("venture_project_id", ventureProjectId);

    if (error) throw translateError(ENTITY, error);
  }

  /** Count of canvas records. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }
}
