/**
 * Sprint 64: Unit Economics Repository
 *
 * CRUD operations for unit_economics table.
 */

import type { UnitEconomicsRow, UnitEconomicsInsert } from "@/types/financial";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "unit_economics";

export type { UnitEconomicsRow, UnitEconomicsInsert };

export class UnitEconomicsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<UnitEconomicsRepository> {
    const client = getSupabaseServiceClient();
    return new UnitEconomicsRepository(client);
  }

  async create(data: UnitEconomicsInsert): Promise<UnitEconomicsRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .insert(data)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return row as UnitEconomicsRow;
  }

  async findByModel(
    financialModelId: string,
  ): Promise<UnitEconomicsRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("financial_model_id", financialModelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return (data as UnitEconomicsRow) ?? null;
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
