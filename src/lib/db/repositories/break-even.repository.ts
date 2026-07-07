/**
 * Sprint 64: Break-Even Analysis Repository
 *
 * CRUD operations for break_even_analysis table.
 */

import type { BreakEvenRow, BreakEvenInsert } from "@/types/financial";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "break_even_analysis";

export type { BreakEvenRow, BreakEvenInsert };

export class BreakEvenRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<BreakEvenRepository> {
    const client = getSupabaseServiceClient();
    return new BreakEvenRepository(client);
  }

  async create(data: BreakEvenInsert): Promise<BreakEvenRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .insert(data)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return row as BreakEvenRow;
  }

  async findByModel(financialModelId: string): Promise<BreakEvenRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("financial_model_id", financialModelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return (data as BreakEvenRow) ?? null;
  }

  async deleteByModel(financialModelId: string): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("financial_model_id", financialModelId);

    if (error) throw translateError(ENTITY, error);
  }

  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }
}
