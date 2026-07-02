/**
 * Sprint 61: AI Investment Committee Repository
 *
 * Persistence layer for investment_committees + committee_votes tables.
 * Repository pattern: owns IDs, handles database I/O.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  InvestmentCommitteeRow,
  InvestmentCommitteeInsert,
  CommitteeVoteRow,
  CommitteeVoteInsert,
} from "@/types/investment-committee";
import type { Uuid } from "@/types/database.types";

export class CommitteeRepository {
  /**
   * Create a new investment committee record.
   */
  async create(data: InvestmentCommitteeInsert): Promise<InvestmentCommitteeRow> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("investment_committees")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create committee: ${error.message}`);
    return row;
  }

  /**
   * Find committee by ID.
   */
  async findById(id: Uuid): Promise<InvestmentCommitteeRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("investment_committees")
      .select()
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Find committee by opportunity_id.
   */
  async findByOpportunityId(opportunityId: Uuid): Promise<InvestmentCommitteeRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("investment_committees")
      .select()
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  /**
   * List all committees.
   */
  async list(filters?: {
    finalDecision?: string;
    minCommitteeScore?: number;
    limit?: number;
    offset?: number;
  }): Promise<InvestmentCommitteeRow[]> {
    const supabase = await createClient();
    let query = supabase
      .from("investment_committees")
      .select()
      .order("created_at", { ascending: false });

    if (filters?.finalDecision) {
      query = query.eq("final_decision", filters.finalDecision);
    }
    if (filters?.minCommitteeScore !== undefined) {
      query = query.gte("committee_score", filters.minCommitteeScore);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to list committees: ${error.message}`);
    return data ?? [];
  }

  /**
   * Count committees.
   */
  async count(filters?: { finalDecision?: string }): Promise<number> {
    const supabase = await createClient();
    let query = supabase
      .from("investment_committees")
      .select("*", { count: "exact", head: true });

    if (filters?.finalDecision) {
      query = query.eq("final_decision", filters.finalDecision);
    }

    const { count, error } = await query;
    if (error) throw new Error(`Failed to count committees: ${error.message}`);
    return count ?? 0;
  }

  /**
   * Delete committee by ID (cascade deletes votes).
   */
  async delete(id: Uuid): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("investment_committees")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete committee: ${error.message}`);
  }
}

export class CommitteeVotesRepository {
  /**
   * Insert multiple votes in a single transaction.
   */
  async insertBatch(votes: CommitteeVoteInsert[]): Promise<CommitteeVoteRow[]> {
    if (votes.length === 0) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("committee_votes")
      .insert(votes)
      .select();

    if (error) throw new Error(`Failed to insert votes: ${error.message}`);
    return data ?? [];
  }

  /**
   * Find all votes for a committee.
   */
  async findByCommitteeId(committeeId: Uuid): Promise<CommitteeVoteRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("committee_votes")
      .select()
      .eq("committee_id", committeeId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to fetch votes: ${error.message}`);
    return data ?? [];
  }

  /**
   * Count votes by agent name.
   */
  async countByAgent(agentName: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("committee_votes")
      .select("*", { count: "exact", head: true })
      .eq("agent_name", agentName);

    if (error) throw new Error(`Failed to count votes: ${error.message}`);
    return count ?? 0;
  }
}
