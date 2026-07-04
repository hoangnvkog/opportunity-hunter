/**
 * Sprint 67: Committee Votes Repository
 */
import type {
  CommitteeVoteRow,
  CommitteeVoteInsert,
} from "@/services/investment-committee/investment-committee.types";

const ENTITY = "committee_votes";

export class CommitteeVotesRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: any) {
    this.client = client;
  }

  static async create(): Promise<CommitteeVotesRepository> {
    const { createClient } = await import("@/lib/supabase/server");
    return new CommitteeVotesRepository(await createClient());
  }

  async create(data: CommitteeVoteInsert): Promise<CommitteeVoteRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`[${ENTITY}] create: ${error.message}`);
    return row as CommitteeVoteRow;
  }

  async createMany(votes: CommitteeVoteInsert[]): Promise<CommitteeVoteRow[]> {
    if (votes.length === 0) return [];
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(votes)
      .select();

    if (error) throw new Error(`[${ENTITY}] createMany: ${error.message}`);
    return (data ?? []) as CommitteeVoteRow[];
  }

  async findByCommitteeId(committeeId: string): Promise<CommitteeVoteRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("committee_id", committeeId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`[${ENTITY}] findByCommitteeId: ${error.message}`);
    return (data ?? []) as CommitteeVoteRow[];
  }

  async findByAgent(agentName: string, limit = 20): Promise<CommitteeVoteRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select()
      .eq("agent_name", agentName)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`[${ENTITY}] findByAgent: ${error.message}`);
    return (data ?? []) as CommitteeVoteRow[];
  }

  async deleteByCommitteeId(committeeId: string): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("committee_id", committeeId);

    if (error) throw new Error(`[${ENTITY}] deleteByCommitteeId: ${error.message}`);
  }
}