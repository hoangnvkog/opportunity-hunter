/**
 * Sprint 64: Financial Projections Repository
 *
 * CRUD operations for financial_projections table.
 */

import type {
  FinancialProjectionRow,
  FinancialProjectionInsert,
} from "@/types/financial";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "financial_projections";

export type { FinancialProjectionRow, FinancialProjectionInsert };

export class FinancialProjectionsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<FinancialProjectionsRepository> {
    const client = getSupabaseServiceClient();
    return new FinancialProjectionsRepository(client);
  }

  async create(
    data: FinancialProjectionInsert,
  ): Promise<FinancialProjectionRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .insert(data)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return row as FinancialProjectionRow;
  }

  async createMany(
    items: FinancialProjectionInsert[],
  ): Promise<FinancialProjectionRow[]> {
    if (items.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(items)
      .select();

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as FinancialProjectionRow[];
  }

  async findByModel(
    financialModelId: string,
  ): Promise<FinancialProjectionRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("financial_model_id", financialModelId)
      .order("year", { ascending: true });

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as FinancialProjectionRow[];
  }

  async findByModelAndYear(
    financialModelId: string,
    year: number,
  ): Promise<FinancialProjectionRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("financial_model_id", financialModelId)
      .eq("year", year)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return (data as FinancialProjectionRow) ?? null;
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
