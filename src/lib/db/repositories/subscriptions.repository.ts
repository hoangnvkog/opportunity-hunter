import type { SubscriptionInsert, SubscriptionRow } from "@/types/subscription";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { RepositoryError, translateError } from "@/lib/db/errors";

const ENTITY = "subscriptions";

export class SubscriptionsRepository {
  private readonly client: AnySupabaseClient;

  constructor(client: AnySupabaseClient) {
    this.client = client;
  }

  static async create(): Promise<SubscriptionsRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new SubscriptionsRepository(await getSupabaseServerClient());
  }

  async insert(values: SubscriptionInsert): Promise<SubscriptionRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(values)
      .select("*")
      .single();

    if (error) {
      throw translateError(ENTITY, error);
    }

    if (!data) {
      throw new RepositoryError(`${ENTITY} insert returned no row`);
    }

    return data;
  }

  async findByUser(userId: string): Promise<SubscriptionRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw translateError(ENTITY, error);
    }

    return data;
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<SubscriptionRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw translateError(ENTITY, error);
    }

    return data;
  }

  async update(id: string, values: Partial<SubscriptionInsert>): Promise<SubscriptionRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .update(values)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw translateError(ENTITY, error);
    }

    if (!data) {
      throw new RepositoryError(`${ENTITY} update returned no row`);
    }

    return data;
  }

  async findAll(): Promise<SubscriptionRow[]> {
    const { data, error } = await this.client.from(ENTITY).select("*");
    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(ENTITY).delete().eq("id", id);

    if (error) {
      throw translateError(ENTITY, error);
    }
  }
}