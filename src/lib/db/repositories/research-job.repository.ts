/**
 * Sprint 62: Autonomous Research Agent
 *
 * Repository for research_jobs table.
 */

import { createClient } from "@/lib/supabase/server";
import type { ResearchJobRow, ResearchJobInsert, ResearchJobStatus } from "@/types/research-job";

export class ResearchJobsRepository {
  /**
   * Create a new research job record.
   */
  async create(data: ResearchJobInsert): Promise<ResearchJobRow> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("research_jobs")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create research job: ${error.message}`);
    return row;
  }

  /**
   * Find job by ID.
   */
  async findById(id: string): Promise<ResearchJobRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_jobs")
      .select()
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Update job status and timestamps.
   */
  async update(id: string, updates: Partial<ResearchJobInsert>): Promise<ResearchJobRow> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("research_jobs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update research job: ${error.message}`);
    return row;
  }

  /**
   * List jobs with optional filtering.
   */
  async list(filters?: {
    status?: ResearchJobStatus;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<ResearchJobRow[]> {
    const supabase = await createClient();
    let query = supabase
      .from("research_jobs")
      .select()
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status as ResearchJobRow["status"]);
    }
    if (filters?.source) {
      query = query.eq("source", filters.source as ResearchJobRow["source"]);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to list research jobs: ${error.message}`);
    return data ?? [];
  }

  /**
   * Count jobs with optional filters.
   */
  async count(filters?: { status?: ResearchJobStatus; source?: string }): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from("research_jobs").select("*", { count: "exact", head: true });

    if (filters?.status) {
      query = query.eq("status", filters.status as ResearchJobRow["status"]);
    }
    if (filters?.source) {
      query = query.eq("source", filters.source as ResearchJobRow["source"]);
    }

    const { count, error } = await query;
    if (error) throw new Error(`Failed to count research jobs: ${error.message}`);
    return count ?? 0;
  }

  /**
   * Delete job by ID (cascade deletes logs).
   */
  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("research_jobs")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete research job: ${error.message}`);
  }
}
