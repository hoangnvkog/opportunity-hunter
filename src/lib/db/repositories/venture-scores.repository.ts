/**
 * Sprint 66: Venture Scores Repository
 *
 * CRUD operations for venture_scores table.
 * Uses type assertions for the Supabase client because the table
 * does not yet exist in database.types.ts. Cast to `any` internally.
 */

import type {
  VentureScoreRow,
  VentureScoreInsert,
  VentureScoreDashboardStats,
  VentureScoreListItem,
} from "@/types/venture-score";

const ENTITY = "venture_scores";

export type { VentureScoreRow, VentureScoreInsert };

export class VentureScoresRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: any) {
    this.client = client;
  }

  static async create(): Promise<VentureScoresRepository> {
    const { createClient } = await import("@/lib/supabase/server");
    const client = await createClient();
    return new VentureScoresRepository(client);
  }

  async create(data: VentureScoreInsert): Promise<VentureScoreRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`[${ENTITY}] create: ${error.message}`);
    return row as VentureScoreRow;
  }

  async upsert(data: VentureScoreInsert): Promise<VentureScoreRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .upsert(data, { onConflict: "opportunity_id" })
      .select()
      .single();

    if (error) throw new Error(`[${ENTITY}] upsert: ${error.message}`);
    return row as VentureScoreRow;
  }

  async update(
    id: string,
    data: Partial<VentureScoreInsert>,
  ): Promise<VentureScoreRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`[${ENTITY}] update: ${error.message}`);
    return row as VentureScoreRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("id", id);

    if (error) throw new Error(`[${ENTITY}] delete: ${error.message}`);
  }

  async findById(id: string): Promise<VentureScoreRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`[${ENTITY}] findById: ${error.message}`);
    return (data ?? null) as VentureScoreRow | null;
  }

  async findByOpportunityId(opportunityId: string): Promise<VentureScoreRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("opportunity_id", opportunityId)
      .maybeSingle();

    if (error) throw new Error(`[${ENTITY}] findByOpportunityId: ${error.message}`);
    return (data ?? null) as VentureScoreRow | null;
  }

  async listTop(options: {
    limit?: number;
    minScore?: number;
  } = {}): Promise<VentureScoreRow[]> {
    const { limit = 20, minScore } = options;
    let q = this.client
      .from(ENTITY)
      .select()
      .order("overall_score", { ascending: false })
      .limit(limit);
    if (typeof minScore === "number") {
      q = q.gte("overall_score", minScore);
    }
    const { data, error } = await q;
    if (error) throw new Error(`[${ENTITY}] listTop: ${error.message}`);
    return (data as VentureScoreRow[]) ?? [];
  }

  async listLatest(options: { limit?: number } = {}): Promise<VentureScoreRow[]> {
    const { limit = 50 } = options;
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`[${ENTITY}] listLatest: ${error.message}`);
    return (data as VentureScoreRow[]) ?? [];
  }

  async listAAA(): Promise<VentureScoreRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("investment_grade", "AAA")
      .order("overall_score", { ascending: false });

    if (error) throw new Error(`[${ENTITY}] listAAA: ${error.message}`);
    return (data as VentureScoreRow[]) ?? [];
  }

  async listByRecommendation(
    recommendation: string,
    limit = 20,
  ): Promise<VentureScoreRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("recommendation", recommendation)
      .order("overall_score", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`[${ENTITY}] listByRecommendation: ${error.message}`);
    return (data as VentureScoreRow[]) ?? [];
  }

  async getDashboardStats(): Promise<VentureScoreDashboardStats> {
    const { data, error } = await this.client.from(ENTITY).select();
    if (error) throw new Error(`[${ENTITY}] getDashboardStats: ${error.message}`);
    const rows = (data as VentureScoreRow[]) ?? [];

    const gradeDistribution: Record<string, number> = {
      AAA: 0, AA: 0, A: 0, BBB: 0, BB: 0, B: 0, Reject: 0,
    };
    const recommendationDistribution: Record<string, number> = {
      "Strong Buy": 0, Buy: 0, Watch: 0, Speculative: 0, Reject: 0,
    };

    let totalScore = 0;
    for (const r of rows) {
      gradeDistribution[r.investment_grade] = (gradeDistribution[r.investment_grade] ?? 0) + 1;
      recommendationDistribution[r.recommendation] = (recommendationDistribution[r.recommendation] ?? 0) + 1;
      totalScore += Number(r.overall_score);
    }

    return {
      total: rows.length,
      average: rows.length > 0 ? Math.round((totalScore / rows.length) * 100) / 100 : 0,
      gradeDistribution,
      recommendationDistribution,
      topByROI: rows.length > 0 ? Math.max(...rows.map((r) => Number(r.roi_score))) : 0,
      topByConfidence: rows.length > 0 ? Math.max(...rows.map((r) => Number(r.confidence_score))) : 0,
      highestRisk: rows.length > 0 ? Math.max(...rows.map((r) => Number(r.risk_score))) : 0,
      lowestRisk: rows.length > 0 ? Math.min(...rows.map((r) => Number(r.risk_score))) : 0,
    };
  }

  async listEnriched(limit = 50): Promise<VentureScoreListItem[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select(
        `id, opportunity_id, overall_score, investment_grade, recommendation,
         confidence_score, risk_score, roi_score, created_at,
         opportunities!inner(title)`,
      )
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`[${ENTITY}] listEnriched: ${error.message}`);

    return ((data ?? []) as Record<string, unknown>[]).map((row: Record<string, unknown>) => {
      const opp = row.opportunities as { title: string } | { title: string }[] | undefined;
      const title = Array.isArray(opp)
        ? opp[0]?.title ?? "Untitled"
        : opp?.title ?? "Untitled";
      return {
        id: row.id as string,
        opportunity_id: row.opportunity_id as string,
        opportunity_title: title,
        overall_score: Number(row.overall_score),
        investment_grade: row.investment_grade as string,
        recommendation: row.recommendation as string,
        confidence_score: Number(row.confidence_score),
        risk_score: Number(row.risk_score),
        roi_score: Number(row.roi_score),
        created_at: row.created_at as string,
      };
    });
  }
}
