import type {
  PipelineRunHistory,
  PipelineRunInsert,
} from "@/types/pipeline-run-history";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "./_base";
import { translateError } from "@/lib/db/errors";

const ENTITY = "pipeline_runs";

export class PipelineRunsRepository {
  private client: AnySupabaseClient;

  private constructor(client: AnySupabaseClient) {
    this.client = client;
  }

  static async create(): Promise<PipelineRunsRepository> {
    const client = getSupabaseServiceClient();
    return new PipelineRunsRepository(client);
  }

  async create(run: PipelineRunInsert): Promise<PipelineRunHistory> {
    const { data, error } = await this.client
      .from("pipeline_runs")
      .insert(run)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create pipeline run: ${error.message}`);
    }

    return data;
  }

  async listLatest(limit = 10): Promise<PipelineRunHistory[]> {
    const { data, error } = await this.client
      .from("pipeline_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch pipeline runs: ${error.message}`);
    }

    return data || [];
  }

  async count(): Promise<number> {
    const { count, error } = await this.client
      .from("pipeline_runs")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw new Error(`Failed to count pipeline runs: ${error.message}`);
    }

    return count || 0;
  }

  async findById(id: string): Promise<PipelineRunHistory | null> {
    const { data, error } = await this.client
      .from("pipeline_runs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch pipeline run: ${error.message}`);
    }

    return data;
  }

  async findRecent(limit = 10): Promise<PipelineRunHistory[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async update(
    id: string,
    patch: {
      finished_at?: string;
      duration_ms?: number;
      sources?: number;
      raw_posts?: number;
      pain_points?: number;
      embeddings?: number;
      clusters?: number;
      opportunities?: number;
      startup_ideas?: number;
      status?: string;
      error_message?: string | null;
    },
  ): Promise<PipelineRunHistory | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  /**
   * Find pipeline runs that are stuck in 'running' status.
   * Used to recover from server crashes that left orphan 'running' rows.
   */
  async findStuckRunning(stuckAfterMinutes = 30): Promise<PipelineRunHistory[]> {
    const cutoff = new Date(Date.now() - stuckAfterMinutes * 60 * 1000).toISOString();
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("status", "running")
      .lt("started_at", cutoff);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  /**
   * Mark a stuck 'running' run as failed (auto-recovery from crash).
   */
  async markStuckAsFailed(id: string, reason: string): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: `[auto-recovery] ${reason}`,
      })
      .eq("id", id)
      .eq("status", "running"); // Only flip if still stuck

    if (error) throw translateError(ENTITY, error);
  }

  async latest(): Promise<PipelineRunHistory | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw translateError(ENTITY, error);
    }
    return data;
  }

  async list(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ runs: PipelineRunHistory[]; total: number }> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const { count, error: countError } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });
    if (countError) throw translateError(ENTITY, countError);

    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw translateError(ENTITY, error);

    return { runs: data ?? [], total: count ?? 0 };
  }
}
