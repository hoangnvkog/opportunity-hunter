/**
 * Sprint 64: Financial Models Repository
 *
 * CRUD operations for financial_models table.
 */

import type {
  FinancialModelRow,
  FinancialModelInsert,
  FinancialModelCardData,
} from "@/types/financial";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "financial_models";

export type { FinancialModelRow, FinancialModelInsert };

export class FinancialModelsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<FinancialModelsRepository> {
    const client = getSupabaseServiceClient();
    return new FinancialModelsRepository(client);
  }

  async create(data: FinancialModelInsert): Promise<FinancialModelRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .insert(data)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return row as FinancialModelRow;
  }

  async findById(id: string): Promise<FinancialModelRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return (data as FinancialModelRow) ?? null;
  }

  async findByVentureProject(
    ventureProjectId: string,
  ): Promise<FinancialModelRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("venture_project_id", ventureProjectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return (data as FinancialModelRow) ?? null;
  }

  async update(
    id: string,
    data: Partial<FinancialModelInsert>,
  ): Promise<FinancialModelRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return row as FinancialModelRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }

  async list(
    options: {
      limit?: number;
      ventureProjectId?: string;
      orderBy?: string;
      ascending?: boolean;
    } = {},
  ): Promise<FinancialModelRow[]> {
    const {
      limit = 50,
      ventureProjectId,
      orderBy = "created_at",
      ascending = false,
    } = options;

    let query = this.client
      .from(ENTITY)
      .select()
      .limit(limit)
      .order(orderBy, { ascending });

    if (ventureProjectId) {
      query = query.eq("venture_project_id", ventureProjectId);
    }

    const { data, error } = await query;

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as FinancialModelRow[];
  }

  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  async countByVentureProject(): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("venture_project_id");

    if (error) throw translateError(ENTITY, error);

    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { venture_project_id: string }[]) {
      counts[row.venture_project_id] =
        (counts[row.venture_project_id] ?? 0) + 1;
    }
    return counts;
  }

  async listCards(
    options: { limit?: number } = {},
  ): Promise<FinancialModelCardData[]> {
    const { limit = 50 } = options;

    const { data, error } = await this.client
      .from(ENTITY)
      .select(
        `
        id,
        venture_project_id,
        currency,
        projection_years,
        created_at,
        venture_projects(name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);

    return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      venture_project_id: row.venture_project_id as string,
      venture_project_name:
        ((row.venture_projects as Record<string, unknown> | null)
          ?.name as string) ?? "Unknown",
      currency: row.currency as string,
      projection_years: row.projection_years as number,
      created_at: row.created_at as string,
    })) as FinancialModelCardData[];
  }
}
