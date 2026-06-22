import { WatchlistsRepository } from "@/lib/db/repositories/watchlists.repository";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { WatchlistCardData, WatchlistInsert, WatchlistUpdate } from "@/types/watchlist";

/**
 * Service for watchlists business logic
 */
export class WatchlistsService {
  private repo: WatchlistsRepository;

  private client: Awaited<ReturnType<typeof getSupabaseServerClient>>;

  constructor(client: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
    this.client = client;
    this.repo = new WatchlistsRepository(client);
  }

  static async create() {
    const client = await getSupabaseServerClient();
    return new WatchlistsService(client);
  }

  /**
   * Create a new watchlist
   */
  async createWatchlist(userId: string, data: WatchlistInsert) {
    return this.repo.create({ ...data, user_id: userId });
  }

  /**
   * Update an existing watchlist
   */
  async updateWatchlist(id: string, userId: string, data: WatchlistUpdate) {
    return this.repo.update(id, userId, data);
  }

  /**
   * Delete a watchlist
   */
  async deleteWatchlist(id: string, userId: string) {
    await this.repo.delete(id, userId);
  }

  /**
   * Get all watchlists for a user with alert counts
   */
  async getUserWatchlists(userId: string): Promise<WatchlistCardData[]> {
    const watchlists = await this.repo.listByUser(userId);
    
    // Get alert counts for each watchlist
    const watchlistsWithCounts = await Promise.all(
      watchlists.map(async (watchlist) => {
        const { count } = await this.client
          .from("alerts")
          .select("*", { count: "exact", head: true })
          .eq("watchlist_id", watchlist.id);

        return {
          ...watchlist,
          alert_count: count || 0,
        };
      })
    );

    return watchlistsWithCounts;
  }
}
