/**
 * Opportunity Validations Repository.
 *
 * Provides CRUD operations for the opportunity_validations table.
 */

import type {
  OpportunityValidationRow,
  OpportunityValidationInsert,
} from "@/types/validation";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { RepositoryError, translateError } from "@/lib/db/errors";

const ENTITY = "opportunity_validations";

export type Uuid = string;

export interface ListValidationsOptions {
  limit?: number;
  offset?: number;
  minScore?: number;
}

export class OpportunityValidationsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<OpportunityValidationsRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new OpportunityValidationsRepository(await getSupabaseServerClient());
  }

  /** Insert a new validation record. */
  async create(input: OpportunityValidationInsert): Promise<OpportunityValidationRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(input)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} insert returned no row`);
    return data;
  }

  /**
   * Upsert a validation record — replace any existing validation for the
   * given opportunity_id with the new values.
   */
  async upsert(
    input: OpportunityValidationInsert,
  ): Promise<OpportunityValidationRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .upsert(input, { onConflict: "opportunity_id" })
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} upsert returned no row`);
    return data;
  }

  /** Find by opportunity_id. */
  async findByOpportunityId(oppId: Uuid): Promise<OpportunityValidationRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", oppId)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  /** List validations ordered by validation_score DESC. */
  async list(opts: ListValidationsOptions = {}): Promise<OpportunityValidationRow[]> {
    const { limit = 50, offset = 0, minScore } = opts;

    let query = this.client
      .from(ENTITY)
      .select("*")
      .order("validation_score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (minScore !== undefined) query = query.gte("validation_score", minScore);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  /** Top N validations by score. */
  async listTop(limit = 20): Promise<OpportunityValidationRow[]> {
    return this.list({ limit, offset: 0 });
  }

  /** Count validated opportunities. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }
}
