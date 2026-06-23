import type { AiUsageLogRow, AiUsageLogInsert } from "@/types/admin";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/errors";

const ENTITY = "ai_usage_logs";

export class AiUsageRepository {
  private readonly client: AnySupabaseClient;

  constructor(client: AnySupabaseClient) {
    this.client = client;
  }

  static async create(): Promise<AiUsageRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new AiUsageRepository(await getSupabaseServerClient());
  }

  async insert(log: AiUsageLogInsert): Promise<AiUsageLogRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(log)
      .select()
      .single();

    if (error) {
      throw translateError(ENTITY, error);
    }
    return data;
  }

  async findByUser(userId: string, limit = 100): Promise<AiUsageLogRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw translateError(ENTITY, error);
    }
    return data ?? [];
  }

  async getTotalCost(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    let query = this.client.from(ENTITY).select("estimated_cost");

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw translateError(ENTITY, error);
    }
    return (data ?? []).reduce((sum, row) => sum + Number(row.estimated_cost), 0);
  }

  async getDailyCost(startDate: string, endDate: string): Promise<{ date: string; cost: number }[]> {
    // Use a view or RPC; fallback: select raw and group in JS for simplicity
    const { data, error } = await this.client
      .from(ENTITY)
      .select("created_at, estimated_cost")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (error) {
      throw translateError(ENTITY, error);
    }

    const byDate: Record<string, number> = {};
    for (const row of data ?? []) {
      const date = row.created_at.slice(0, 10);
      byDate[date] = (byDate[date] ?? 0) + Number(row.estimated_cost);
    }

    return Object.entries(byDate)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMonthlyStats(year: number, month: number): Promise<{
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
    requests: number;
  }> {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const { data, error } = await this.client
      .from(ENTITY)
      .select("input_tokens, output_tokens, estimated_cost")
      .gte("created_at", start)
      .lt("created_at", end);

    if (error) {
      throw translateError(ENTITY, error);
    }

    let totalCost = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    for (const row of data ?? []) {
      totalCost += Number(row.estimated_cost);
      inputTokens += row.input_tokens;
      outputTokens += row.output_tokens;
    }

    return { totalCost, inputTokens, outputTokens, requests: data?.length ?? 0 };
  }

  async getProviderBreakdown(startDate: string, endDate: string): Promise<
    { provider: string; cost: number; requests: number }[]
  > {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("provider, estimated_cost")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (error) {
      throw translateError(ENTITY, error);
    }

    const byProvider: Record<string, { cost: number; requests: number }> = {};
    for (const row of data ?? []) {
      if (!byProvider[row.provider]) {
        byProvider[row.provider] = { cost: 0, requests: 0 };
      }
      byProvider[row.provider].cost += Number(row.estimated_cost);
      byProvider[row.provider].requests += 1;
    }

    return Object.entries(byProvider).map(([provider, stats]) => ({
      provider,
      ...stats,
    }));
  }
}