import { WatchlistsRepository } from "@/lib/db/repositories/watchlists.repository";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { OpportunityRow } from "@/types/database.types";
import type { WatchlistRow } from "@/types/watchlist";

/**
 * Service for matching opportunities to watchlists
 */
export class MatchingService {
  private repo: WatchlistsRepository;

  private client: ReturnType<typeof getSupabaseServiceClient>;

  constructor(client: ReturnType<typeof getSupabaseServiceClient>) {
    this.client = client;
    this.repo = new WatchlistsRepository(client);
  }

  static async create() {
    const client = getSupabaseServiceClient();
    return new MatchingService(client);
  }

  /**
   * Match an opportunity against all watchlists for all users
   * Returns array of { userId, watchlistId } for matches
   */
  async matchOpportunityToWatchlists(opportunity: OpportunityRow): Promise<Array<{ userId: string; watchlistId: string }>> {
    // Get all watchlists
    const { data: watchlists, error } = await this.client
      .from("watchlists")
      .select("*");

    if (error) {
      console.error("Error fetching watchlists:", error);
      return [];
    }

    if (!watchlists) return [];

    const matches: Array<{ userId: string; watchlistId: string }> = [];

    for (const watchlist of watchlists) {
      if (this.doesOpportunityMatch(opportunity, watchlist)) {
        matches.push({
          userId: watchlist.user_id,
          watchlistId: watchlist.id,
        });
      }
    }

    return matches;
  }

  /**
   * Check if an opportunity matches a watchlist
   */
  private doesOpportunityMatch(opportunity: OpportunityRow, watchlist: WatchlistRow): boolean {
    // Check search term (case-insensitive)
    if (watchlist.search) {
      const searchTerm = watchlist.search.toLowerCase();
      const title = (opportunity.title || "").toLowerCase();
      const description = (opportunity.description || "").toLowerCase();
      
      if (!title.includes(searchTerm) && !description.includes(searchTerm)) {
        return false;
      }
    }

    // Check minimum score
    if (watchlist.min_score !== null && parseFloat(opportunity.score) < watchlist.min_score) {
      return false;
    }

    // Check minimum frequency
    if (watchlist.min_frequency !== null && opportunity.frequency < watchlist.min_frequency) {
      return false;
    }

    // Check minimum severity
    if (watchlist.min_severity !== null && parseFloat(opportunity.severity) < watchlist.min_severity) {
      return false;
    }

    // Check minimum buying intent
    if (watchlist.min_buying_intent !== null && parseFloat(opportunity.buying_intent) < watchlist.min_buying_intent) {
      return false;
    }

    return true;
  }
}
