import type { PipelineRunHistory, PipelineRunInsert } from "@/types/pipeline-run-history";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { AnySupabaseClient } from "./_base";
import { translateError } from "@/lib/db/errors";

const ENTITY = "pipeline_runs";

export class PipelineRunsRepository {
  private client: AnySupabaseClient;

  private constructor(client: AnySupabaseClient) {
    this.client = client;
  }

  static async create(): Promise<PipelineRunsRepository> {
    const client = await getSupabaseServerClient();
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
      .from("pipeline_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }
}
