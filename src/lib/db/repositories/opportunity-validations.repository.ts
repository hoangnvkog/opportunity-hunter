/**
 * Opportunity Validations Repository.
 *
 * CRUD operations for the opportunity_validations table (Sprint 52).
 * AI-powered validation replaces the deterministic Sprint 51 version.
 */

import type {
  OpportunityValidationRow,
  OpportunityValidationInsert,
} from "@/types/validation";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { RepositoryError, translateError } from "@/lib/db/errors";

const ENTITY = "opportunity_validations";

export type { OpportunityValidationRow, OpportunityValidationInsert };

export interface ListValidationsOptions {
  limit?: number;
  offset?: number;
  minScore?: number;
}

export class OpportunityValidationsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<OpportunityValidationsRepository> {
    return new OpportunityValidationsRepository(getSupabaseServiceClient());
  }

  /** Insert a new validation record. */
  async create(
    input: OpportunityValidationInsert,
  ): Promise<OpportunityValidationRow> {
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
   * given opportunity_id (idempotent, skip duplicates).
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
  async findByOpportunityId(
    oppId: string,
  ): Promise<OpportunityValidationRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", oppId)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  /**
   * List validations ordered by validation_score DESC.
   * Optionally filter by minimum score.
   */
  async list(
    opts: ListValidationsOptions = {},
  ): Promise<OpportunityValidationRow[]> {
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

  /** Count all validation records. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Get IDs of all already-validated opportunities. */
  async listValidatedIds(limit = 1000): Promise<string[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("opportunity_id")
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return (data ?? []).map((r) => r.opportunity_id as string);
  }
}
