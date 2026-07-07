/**
 * Opportunity Evidence Repository (Sprint 53).
 *
 * CRUD operations for opportunity_evidence table.
 */

import type {
  OpportunityEvidenceRow,
  OpportunityEvidenceInsert,
  EvidenceType,
} from "@/types/evidence";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/errors";

const ENTITY = "opportunity_evidence";

export type { OpportunityEvidenceRow, OpportunityEvidenceInsert };

export class OpportunityEvidenceRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<OpportunityEvidenceRepository> {
    return new OpportunityEvidenceRepository(getSupabaseServiceClient());
  }

  /** Insert multiple evidence records. */
  async createMany(
    records: OpportunityEvidenceInsert[],
  ): Promise<OpportunityEvidenceRow[]> {
    if (records.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(records)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as OpportunityEvidenceRow[];
  }

  /** List evidence for an opportunity. */
  async listByOpportunity(
    opportunityId: string,
  ): Promise<OpportunityEvidenceRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("confidence", { ascending: false });

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as OpportunityEvidenceRow[];
  }

  /** Delete all evidence for an opportunity. */
  async deleteByOpportunity(opportunityId: string): Promise<number> {
    // Get count before delete
    const { count: beforeCount } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true })
      .eq("opportunity_id", opportunityId);

    // Delete
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("opportunity_id", opportunityId);

    if (error) throw translateError(ENTITY, error);
    return beforeCount ?? 0;
  }

  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Evidence count for one opportunity. */
  async countByOpportunity(opportunityId: string): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true })
      .eq("opportunity_id", opportunityId);

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Average confidence across all evidence, or for a single opportunity. */
  async averageConfidence(opportunityId?: string): Promise<number> {
    let query = this.client.from(ENTITY).select("*");

    if (opportunityId) {
      query = query.eq("opportunity_id", opportunityId);
    }

    const { data, error } = await query;

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const rows = data as OpportunityEvidenceRow[];
    const sum = rows.reduce((acc, row) => acc + row.confidence, 0);
    return Math.round((sum / rows.length) * 100) / 100;
  }

  /** Count unique opportunities that have evidence. */
  async countOpportunitiesWithEvidence(): Promise<number> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("opportunity_id");

    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as { opportunity_id: string }[];
    const unique = new Set(rows.map((r) => r.opportunity_id));
    return unique.size;
  }

  /** Find all evidence with pagination. */
  async list(opts: {
    limit?: number;
    offset?: number;
    type?: EvidenceType;
    opportunityId?: string;
  }): Promise<OpportunityEvidenceRow[]> {
    let query = this.client.from(ENTITY).select("*");

    if (opts.opportunityId) {
      query = query.eq("opportunity_id", opts.opportunityId);
    }
    if (opts.type) {
      query = query.eq("evidence_type", opts.type);
    }
    if (opts.limit) {
      query = query.limit(opts.limit);
    }
    if (opts.offset) {
      query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);
    }

    query = query.order("confidence", { ascending: false });

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as OpportunityEvidenceRow[];
  }
}
