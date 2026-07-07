/**
 * Sprint 67: Investment Committees Repository
 *
 * CRUD for investment_committees table.
 * Gracefully returns empty results when table doesn't exist yet (dev/migration pending).
 */
import type {
  InvestmentCommitteeRow,
  InvestmentCommitteeInsert,
  CommitteeCardData,
  CommitteeDashboardStats,
  FinalDecision,
} from "@/services/investment-committee/investment-committee.types";

const ENTITY = "investment_committees";

function isNotFoundError(error: { message?: string }): boolean {
  if (!error?.message) return false;
  const msg = error.message;
  return (
    msg.includes("not found") ||
    msg.includes("does not exist") ||
    msg.includes("invalid reference")
  );
}

export class InvestmentCommitteesRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: any) {
    this.client = client;
  }

  static async create(): Promise<InvestmentCommitteesRepository> {
    const { getSupabaseServiceClient } = await import("@/lib/supabase");
    return new InvestmentCommitteesRepository(getSupabaseServiceClient());
  }

  async create(data: InvestmentCommitteeInsert): Promise<InvestmentCommitteeRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`[${ENTITY}] create: ${error.message}`);
    return row as InvestmentCommitteeRow;
  }

  async upsert(data: InvestmentCommitteeInsert): Promise<InvestmentCommitteeRow> {
    const { data: row, error } = await this.client
      .from(ENTITY)
      .upsert(data, { onConflict: "opportunity_id" })
      .select()
      .single();

    if (error) throw new Error(`[${ENTITY}] upsert: ${error.message}`);
    return row as InvestmentCommitteeRow;
  }

  async findById(id: string): Promise<InvestmentCommitteeRow | null> {
    try {
      const { data, error } = await this.client
        .from(ENTITY)
        .select()
        .eq("id", id)
        .maybeSingle();

      if (error) throw new Error(`[${ENTITY}] findById: ${error.message}`);
      return (data ?? null) as InvestmentCommitteeRow | null;
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) return null;
      throw e;
    }
  }

  async findByOpportunityId(oppId: string): Promise<InvestmentCommitteeRow | null> {
    try {
      const { data, error } = await this.client
        .from(ENTITY)
        .select()
        .eq("opportunity_id", oppId)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) throw new Error(`[${ENTITY}] findByOpportunityId: ${error.message}`);
      return (data ?? null) as InvestmentCommitteeRow | null;
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) return null;
      throw e;
    }
  }

  async listRecent(limit = 20): Promise<InvestmentCommitteeRow[]> {
    try {
      const { data, error } = await this.client
        .from(ENTITY)
        .select()
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(`[${ENTITY}] listRecent: ${error.message}`);
      return (data ?? []) as InvestmentCommitteeRow[];
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) return [];
      throw e;
    }
  }

  async listByDecision(
    decision: FinalDecision,
    limit = 20,
  ): Promise<InvestmentCommitteeRow[]> {
    try {
      const { data, error } = await this.client
        .from(ENTITY)
        .select()
        .eq("final_decision", decision)
        .order("overall_score", { ascending: false })
        .limit(limit);

      if (error) throw new Error(`[${ENTITY}] listByDecision: ${error.message}`);
      return (data ?? []) as InvestmentCommitteeRow[];
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) return [];
      throw e;
    }
  }

  async getDashboardStats(): Promise<CommitteeDashboardStats> {
    try {
      const { data, error } = await this.client.from(ENTITY).select();
      if (error) throw new Error(`[${ENTITY}] getDashboardStats: ${error.message}`);
      const rows = (data ?? []) as InvestmentCommitteeRow[];

      if (rows.length === 0) {
        return {
          total: 0, averageScore: 0, averageConfidence: 0,
          strongBuyCount: 0, buyCount: 0, watchCount: 0, rejectCount: 0,
          approvalRate: 0, topScore: 0,
        };
      }

      let totalScore = 0, totalConf = 0;
      let strongBuy = 0, buy = 0, watch = 0, reject = 0;
      let topScore = 0;

      for (const r of rows) {
        const s = Number(r.overall_score);
        totalScore += s;
        totalConf += Number(r.confidence);
        if (s > topScore) topScore = s;
        switch (r.final_decision) {
          case "Strong Buy": strongBuy++; break;
          case "Buy": buy++; break;
          case "Watch": watch++; break;
          case "Reject": reject++; break;
        }
      }

      const n = rows.length;
      return {
        total: n,
        averageScore: Math.round((totalScore / n) * 100) / 100,
        averageConfidence: Math.round((totalConf / n) * 100) / 100,
        strongBuyCount: strongBuy,
        buyCount: buy,
        watchCount: watch,
        rejectCount: reject,
        approvalRate: Math.round(((strongBuy + buy) / n) * 100),
        topScore,
      };
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) {
        return {
          total: 0, averageScore: 0, averageConfidence: 0,
          strongBuyCount: 0, buyCount: 0, watchCount: 0, rejectCount: 0,
          approvalRate: 0, topScore: 0,
        };
      }
      throw e;
    }
  }

  async listCards(limit = 50): Promise<CommitteeCardData[]> {
    try {
      const { data, error } = await this.client
        .from(ENTITY)
        .select(`
          id, opportunity_id, overall_score, confidence, final_decision,
          majority_vote, minority_vote, created_at,
          opportunities!inner(title)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(`[${ENTITY}] listCards: ${error.message}`);

      return ((data ?? []) as Record<string, unknown>[]).map((row: Record<string, unknown>) => {
        const opp = row.opportunities as { title: string } | undefined;
        return {
          id: row.id as string,
          opportunity_id: row.opportunity_id as string,
          opportunity_title: opp?.title ?? "Untitled",
          final_decision: row.final_decision as FinalDecision,
          overall_score: Number(row.overall_score),
          confidence: Number(row.confidence),
          majority_vote: (row.majority_vote as string | null),
          minority_vote: (row.minority_vote as string | null),
          votes_count: 5,
          created_at: row.created_at as string,
        };
      });
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) return [];
      throw e;
    }
  }

  async listHighConfidence(limit = 10): Promise<InvestmentCommitteeRow[]> {
    try {
      const { data, error } = await this.client
        .from(ENTITY)
        .select()
        .order("confidence", { ascending: false })
        .limit(limit);

      if (error) throw new Error(`[${ENTITY}] listHighConfidence: ${error.message}`);
      return (data ?? []) as InvestmentCommitteeRow[];
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) return [];
      throw e;
    }
  }

  async listSplitVotes(limit = 10): Promise<InvestmentCommitteeRow[]> {
    try {
      const { data, error } = await this.client
        .from(ENTITY)
        .select()
        .not("majority_vote", "is", "null")
        .not("minority_vote", "is", "null")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(`[${ENTITY}] listSplitVotes: ${error.message}`);
      return (data ?? []) as InvestmentCommitteeRow[];
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) return [];
      throw e;
    }
  }

  async listStrongBuy(limit = 10): Promise<InvestmentCommitteeRow[]> {
    try {
      const { data, error } = await this.client
        .from(ENTITY)
        .select()
        .eq("final_decision", "Strong Buy")
        .order("overall_score", { ascending: false })
        .limit(limit);

      if (error) throw new Error(`[${ENTITY}] listStrongBuy: ${error.message}`);
      return (data ?? []) as InvestmentCommitteeRow[];
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) return [];
      throw e;
    }
  }

  async listRejected(limit = 10): Promise<InvestmentCommitteeRow[]> {
    try {
      const { data, error } = await this.client
        .from(ENTITY)
        .select()
        .eq("final_decision", "Reject")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(`[${ENTITY}] listRejected: ${error.message}`);
      return (data ?? []) as InvestmentCommitteeRow[];
    } catch (e: unknown) {
      if (isNotFoundError(e as { message?: string })) return [];
      throw e;
    }
  }

  async getAgentStats(): Promise<{
    mostOptimistic: string;
    mostConservative: string;
    agreementRate: number;
  }> {
    try {
      const { data, error } = await this.client
        .from("committee_votes")
        .select("agent_name, vote");

      if (error) {
        return { mostOptimistic: "MARKET_ANALYST", mostConservative: "VC_PARTNER", agreementRate: 0 };
      }

      type VoteRow = { agent_name: string; vote: string };
      const rows = (data ?? []) as VoteRow[];

      const agentAvg: Record<string, number[]> = {};
      for (const r of rows) {
        if (!agentAvg[r.agent_name]) agentAvg[r.agent_name] = [];
        const num = r.vote === "BUY" ? 100 : r.vote === "WATCH" ? 50 : 0;
        agentAvg[r.agent_name].push(num);
      }

      const agentMeans: Record<string, number> = {};
      for (const [k, vals] of Object.entries(agentAvg)) {
        agentMeans[k] = vals.reduce((a, b) => a + b, 0) / vals.length;
      }

      const entries = Object.entries(agentMeans);
      const mostOpt = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "MARKET_ANALYST";
      const mostCons = entries.sort((a, b) => a[1] - b[1])[0]?.[0] ?? "VC_PARTNER";

      const { data: icData, error: icErr } = await this.client
        .from(ENTITY)
        .select("majority_vote");

      let agreementRate = 0;
      if (!icErr && icData) {
        const icRows = icData as { majority_vote: string | null }[];
        const agreeing = icRows.filter(r => r.majority_vote === "BUY" || r.majority_vote === null);
        agreementRate = icRows.length > 0
          ? Math.round((agreeing.length / icRows.length) * 100)
          : 0;
      }

      return { mostOptimistic: mostOpt, mostConservative: mostCons, agreementRate };
    } catch {
      return { mostOptimistic: "MARKET_ANALYST", mostConservative: "VC_PARTNER", agreementRate: 0 };
    }
  }
}