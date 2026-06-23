import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Uuid } from "@/types";

/**
 * Repository for alerts table operations
 */
export class AlertsRepository {
  constructor(private client: SupabaseClient<Database>) {}

  static async create() {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new AlertsRepository(await getSupabaseServerClient());
  }

  /**
   * Create a new alert
   */
  async create(data: {
    user_id: Uuid;
    watchlist_id: Uuid;
    opportunity_id: Uuid;
  }) {
    const { data: alert, error } = await this.client
      .from("alerts")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return alert;
  }

  /**
   * List all alerts for a user with opportunity and watchlist details
   */
  async listByUser(userId: Uuid) {
    const { data: alerts, error } = await this.client
      .from("alerts")
      .select(`
        *,
        watchlist:watchlists(name),
        opportunity:opportunities(
          id,
          title,
          score,
          cluster:pain_clusters(name)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return alerts || [];
  }

  /**
   * Mark a single alert as read
   */
  async markRead(id: Uuid, userId: Uuid) {
    const { data: alert, error } = await this.client
      .from("alerts")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return alert;
  }

  /**
   * Mark all alerts for a user as read
   */
  async markAllRead(userId: Uuid) {
    const { error } = await this.client
      .from("alerts")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  }

  /**
   * Count unread alerts for a user
   */
  async countUnread(userId: Uuid) {
    const { count, error } = await this.client
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  }

  async countAll(): Promise<number> {
    const { count, error } = await this.client
      .from("alerts")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  }
}
