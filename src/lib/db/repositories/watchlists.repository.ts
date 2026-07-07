import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { Uuid } from "@/types";

/**
 * Repository for watchlists table operations
 */
export class WatchlistsRepository {
  constructor(private client: SupabaseClient<Database>) {}

  static async create() {
    return new WatchlistsRepository(getSupabaseServiceClient());
  }

  /**
   * Create a new watchlist
   */
  async create(data: {
    user_id: Uuid;
    name: string;
    search?: string | null;
    min_score?: number | null;
    min_frequency?: number | null;
    min_severity?: number | null;
    min_buying_intent?: number | null;
  }) {
    const { data: watchlist, error } = await this.client
      .from("watchlists")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return watchlist;
  }

  /**
   * Update an existing watchlist
   */
  async update(
    id: Uuid,
    userId: Uuid,
    data: {
      name?: string;
      search?: string | null;
      min_score?: number | null;
      min_frequency?: number | null;
      min_severity?: number | null;
      min_buying_intent?: number | null;
    },
  ) {
    const { data: watchlist, error } = await this.client
      .from("watchlists")
      .update(data)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return watchlist;
  }

  /**
   * Delete a watchlist
   */
  async delete(id: Uuid, userId: Uuid) {
    const { error } = await this.client
      .from("watchlists")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  }

  /**
   * Find a watchlist by ID
   */
  async findById(id: Uuid, userId: Uuid) {
    const { data: watchlist, error } = await this.client
      .from("watchlists")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return watchlist;
  }

  /**
   * List all watchlists for a user
   */
  async listByUser(userId: Uuid) {
    const { data: watchlists, error } = await this.client
      .from("watchlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return watchlists || [];
  }

  /**
   * Get all watchlists (for matching engine)
   */
  async getAllWatchlists() {
    const { data: watchlists, error } = await this.client
      .from("watchlists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return watchlists || [];
  }

  /**
   * Count watchlists for a user
   */
  async countByUser(userId: Uuid) {
    const { count, error } = await this.client
      .from("watchlists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) throw error;
    return count || 0;
  }

  async countAll(): Promise<number> {
    const { count, error } = await this.client
      .from("watchlists")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  }
}
