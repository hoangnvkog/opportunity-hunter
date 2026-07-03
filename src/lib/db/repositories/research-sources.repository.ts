/**
 * Sprint 62: Autonomous Research Agent
 *
 * Repository for research_sources table.
 */

import { createClient } from "@/lib/supabase/server";
import type { ResearchSourceRow, ResearchSourceInsert } from "@/types/research-job";

export class ResearchSourcesRepository {
  /**
   * Find all enabled sources ordered by priority.
   */
  async findEnabled(): Promise<ResearchSourceRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_sources")
      .select()
      .eq("enabled", true)
      .order("priority", { ascending: false });

    if (error) throw new Error(`Failed to fetch research sources: ${error.message}`);
    return data ?? [];
  }

  /**
   * Find source by name.
   */
  async findByName(name: string): Promise<ResearchSourceRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_sources")
      .select()
      .eq("name", name as ResearchSourceRow["name"])
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Update source (e.g., last_sync, enabled, priority, rate_limit).
   */
  async update(id: string, updates: Partial<ResearchSourceInsert>): Promise<ResearchSourceRow> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("research_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update research source: ${error.message}`);
    return row;
  }
}