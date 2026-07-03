/**
 * Sprint 62: Autonomous Research Agent
 *
 * Repository for research_logs table.
 */

import { createClient } from "@/lib/supabase/server";
import type { ResearchLogRow, ResearchLogInsert } from "@/types/research-job";

export class ResearchLogsRepository {
  /**
   * Create a new research log record.
   */
  async create(data: ResearchLogInsert): Promise<ResearchLogRow> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("research_logs")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create research log: ${error.message}`);
    return row;
  }

  /**
   * Find logs by job ID.
   */
  async findByJobId(jobId: string): Promise<ResearchLogRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_logs")
      .select()
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to fetch research logs: ${error.message}`);
    return data ?? [];
  }
}