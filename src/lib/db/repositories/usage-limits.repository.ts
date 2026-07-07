import type { UsageLimitRow } from "@/types/subscription";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/errors";

const ENTITY = "usage_limits";

export class UsageLimitsRepository {
  private readonly client: AnySupabaseClient;

  constructor(client: AnySupabaseClient) {
    this.client = client;
  }

  static async create(): Promise<UsageLimitsRepository> {
    return new UsageLimitsRepository(getSupabaseServiceClient());
  }

  async findCurrentMonth(userId: string): Promise<UsageLimitRow | null> {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw translateError(ENTITY, error);
    }

    return data;
  }

  async incrementOpportunities(userId: string, amount = 1): Promise<void> {
    const month = new Date().toISOString().slice(0, 7);
    const { data: current } = await this.client
      .from(ENTITY)
      .select("id, opportunities_used")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    if (current) {
      const { error } = await this.client
        .from(ENTITY)
        .update({ opportunities_used: current.opportunities_used + amount })
        .eq("id", current.id);

      if (error) {
        throw translateError(ENTITY, error);
      }
    } else {
      const { error } = await this.client.from(ENTITY).insert({
        user_id: userId,
        month,
        opportunities_used: amount,
        insights_used: 0,
        emails_sent: 0,
      });

      if (error) {
        throw translateError(ENTITY, error);
      }
    }
  }

  async incrementInsights(userId: string, amount = 1): Promise<void> {
    const month = new Date().toISOString().slice(0, 7);
    const { data: current } = await this.client
      .from(ENTITY)
      .select("id, insights_used")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    if (current) {
      const { error } = await this.client
        .from(ENTITY)
        .update({ insights_used: current.insights_used + amount })
        .eq("id", current.id);

      if (error) {
        throw translateError(ENTITY, error);
      }
    } else {
      const { error } = await this.client.from(ENTITY).insert({
        user_id: userId,
        month,
        opportunities_used: 0,
        insights_used: amount,
        emails_sent: 0,
      });

      if (error) {
        throw translateError(ENTITY, error);
      }
    }
  }

  async incrementEmails(userId: string, amount = 1): Promise<void> {
    const month = new Date().toISOString().slice(0, 7);
    const { data: current } = await this.client
      .from(ENTITY)
      .select("id, emails_sent")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    if (current) {
      const { error } = await this.client
        .from(ENTITY)
        .update({ emails_sent: current.emails_sent + amount })
        .eq("id", current.id);

      if (error) {
        throw translateError(ENTITY, error);
      }
    } else {
      const { error } = await this.client.from(ENTITY).insert({
        user_id: userId,
        month,
        opportunities_used: 0,
        insights_used: 0,
        emails_sent: amount,
      });

      if (error) {
        throw translateError(ENTITY, error);
      }
    }
  }

  async resetMonth(userId: string): Promise<void> {
    const month = new Date().toISOString().slice(0, 7);
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("user_id", userId)
      .eq("month", month);

    if (error) {
      throw translateError(ENTITY, error);
    }
  }
}
