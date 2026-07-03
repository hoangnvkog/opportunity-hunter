import { AlertsRepository } from "@/lib/db/repositories/alerts.repository";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AlertCardData } from "@/types/watchlist";

/**
 * Service for alerts business logic
 */
export class AlertsService {
  private repo: AlertsRepository;

  constructor(client: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
    this.repo = new AlertsRepository(client);
  }

  static async create() {
    const client = await getSupabaseServerClient();
    return new AlertsService(client);
  }

  /**
   * Create a new alert
   */
  async createAlert(userId: string, watchlistId: string, opportunityId: string) {
    return this.repo.create({
      user_id: userId,
      watchlist_id: watchlistId,
      opportunity_id: opportunityId,
    });
  }

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(userId: string): Promise<AlertCardData[]> {
    const alerts = await this.repo.listByUser(userId);

    return alerts.map((alert) => ({
      id: alert.id,
      watchlist_id: alert.watchlist_id,
      watchlist_name: alert.watchlist?.name ?? "Unknown",
      opportunity_id: alert.opportunity_id,
      opportunity_title: alert.opportunity?.title ?? "Unknown",
      cluster_name: alert.opportunity?.cluster?.name ?? "Unknown",
      score: alert.opportunity?.score ? parseFloat(alert.opportunity.score) : 0,
      is_read: alert.is_read,
      created_at: alert.created_at,
    }));
  }

  /**
   * Mark a single alert as read
   */
  async markAlertRead(id: string, userId: string) {
    return this.repo.markRead(id, userId);
  }

  /**
   * Mark all alerts as read
   */
  async markAllAlertsRead(userId: string) {
    await this.repo.markAllRead(userId);
  }

  /**
   * Get unread alert count
   */
  async getUnreadCount(userId: string) {
    return this.repo.countUnread(userId);
  }
}
