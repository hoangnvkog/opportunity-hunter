/**
 * Venture Projects Repository (Sprint 63).
 *
 * CRUD operations for venture_projects table.
 * Stores AI-generated startup blueprints (complete venture studio output).
 */

import type {
  VentureProjectInsert,
  VentureProjectRow,
  VentureProjectCardData,
  VentureStudioStats,
} from "@/types/venture-studio";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/repositories/_base";

const ENTITY = "venture_projects";

export type { VentureProjectRow, VentureProjectInsert };

export class VentureProjectsRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<VentureProjectsRepository> {
    return new VentureProjectsRepository(getSupabaseServiceClient());
  }

  /** Insert a single venture project record. */
  async create(record: VentureProjectInsert): Promise<VentureProjectRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert([record] as never)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as VentureProjectRow;
  }

  /** Insert multiple venture project records. */
  async createMany(
    records: VentureProjectInsert[],
  ): Promise<VentureProjectRow[]> {
    if (records.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(records as never)
      .select("*");

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as VentureProjectRow[];
  }

  /** Find venture project by id. */
  async findById(id: string): Promise<VentureProjectRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as VentureProjectRow | null;
  }

  /** Find latest venture project for an opportunity. */
  async findByOpportunity(
    opportunityId: string,
  ): Promise<VentureProjectRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data as VentureProjectRow | null;
  }

  /** Find multiple venture projects by opportunity ids. */
  async findByIds(ids: string[]): Promise<VentureProjectRow[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .in("id", ids);

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as VentureProjectRow[];
  }

  /** Update a venture project record. */
  async update(
    id: string,
    updates: Partial<Omit<VentureProjectInsert, "id" | "opportunity_id">>,
  ): Promise<VentureProjectRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .update(updates as never)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw translateError(ENTITY, error);
    return data as VentureProjectRow;
  }

  /** Delete a venture project record. */
  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) throw translateError(ENTITY, error);
  }

  /** List venture projects with pagination. */
  async list(
    opts: {
      limit?: number;
      offset?: number;
      status?: string;
      minScore?: number;
      orderBy?: "overall_score" | "created_at" | "name";
      ascending?: boolean;
    } = {},
  ): Promise<VentureProjectRow[]> {
    const {
      limit = 50,
      offset = 0,
      status,
      minScore,
      orderBy = "created_at",
      ascending = false,
    } = opts;

    let query = this.client.from(ENTITY).select("*");

    if (status !== undefined) {
      query = query.eq("status", status);
    }
    if (minScore !== undefined) {
      query = query.gte("overall_score", minScore);
    }

    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as VentureProjectRow[];
  }

  /** Total count of venture projects. */
  async count(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Count projects by status. */
  async countByStatus(status: string): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("id", { count: "exact", head: true })
      .eq("status", status);

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /** Average overall_score across all projects. */
  async averageScore(): Promise<number> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("overall_score");

    if (error) throw translateError(ENTITY, error);
    if (!data || data.length === 0) return 0;

    const rows = data as Array<{ overall_score: number }>;
    const sum = rows.reduce((acc, row) => acc + (row.overall_score ?? 0), 0);
    return Math.round((sum / rows.length) * 100) / 100;
  }

  /**
   * Aggregate stats for the dashboard.
   */
  async getStats(): Promise<VentureStudioStats> {
    const { data, error } = await this.client.from(ENTITY).select("*");

    if (error) throw translateError(ENTITY, error);
    const rows = (data ?? []) as VentureProjectRow[];

    if (rows.length === 0) {
      return {
        total: 0,
        readyToBuild: 0,
        averageScore: 0,
        averageMvpCost: "$0",
      };
    }

    const readyToBuild = rows.filter((r) => r.status === "ready").length;

    const sumScore = rows.reduce((acc, r) => acc + (r.overall_score ?? 0), 0);
    const averageScore = Math.round((sumScore / rows.length) * 100) / 100;

    return {
      total: rows.length,
      readyToBuild,
      averageScore,
      averageMvpCost: "$0", // Will be enriched with MVP data
    };
  }

  /**
   * List project cards (project + canvas + mvp joined).
   * Powers the dashboard table.
   */
  async listCards(
    opts: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {},
  ): Promise<VentureProjectCardData[]> {
    const { limit = 50, offset = 0, status } = opts;

    let query = this.client.from(ENTITY).select(
      `
        id,
        opportunity_id,
        startup_idea_id,
        name,
        tagline,
        status,
        overall_score,
        created_at
      `,
    );

    if (status !== undefined) {
      query = query.eq("status", status);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw translateError(ENTITY, error);

    return (data ?? []) as VentureProjectCardData[];
  }
}
