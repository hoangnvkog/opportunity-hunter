import { translateError, NotFoundError } from "@/lib/db/errors";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import type { Uuid } from "@/types";

const ENTITY = "email_notifications";

/**
 * Repository for email_notifications table operations
 */
export class EmailNotificationsRepository {
  constructor(private client: AnySupabaseClient) {}

  static async create() {
    return new EmailNotificationsRepository(getSupabaseServiceClient());
  }

  /**
   * Create a new email notification (or return existing one for the same alert).
   */
  async create(data: { user_id: Uuid; alert_id: Uuid }) {
    const { data: notification, error } = await this.client
      .from(ENTITY)
      .insert({
        user_id: data.user_id,
        alert_id: data.alert_id,
        status: "queued",
      })
      .select()
      .single();

    if (error) {
      // If duplicate already exists for this alert+user, fetch and return it.
      if (error.code === "23505") {
        const existing = await this.findByAlert(data.user_id, data.alert_id);
        if (existing) return existing;
      }
      throw translateError(ENTITY, error);
    }
    if (!notification)
      throw new NotFoundError(ENTITY, `${data.user_id}/${data.alert_id}`);
    return notification;
  }

  /**
   * Find existing email notification by user + alert.
   */
  async findByAlert(userId: Uuid, alertId: Uuid) {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("user_id", userId)
      .eq("alert_id", alertId)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  /**
   * Mark an email as sent and record sent_at timestamp.
   */
  async markSent(id: Uuid) {
    const { data, error } = await this.client
      .from(ENTITY)
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        error_message: null as string | null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  /**
   * Mark an email as failed and store the error message.
   */
  async markFailed(id: Uuid, errorMessage: string) {
    const { data, error } = await this.client
      .from(ENTITY)
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  /**
   * Re-queue a failed email for retry (used when attempts < max).
   */
  async requeue(id: Uuid) {
    const { data, error } = await this.client
      .from(ENTITY)
      .update({
        status: "queued",
        error_message: null as string | null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  /**
   * Increment attempts counter (manual update — used in retry loop).
   */
  async incrementAttempts(id: Uuid) {
    const current = await this.client
      .from(ENTITY)
      .select("attempts")
      .eq("id", id)
      .single();

    if (current.error) throw translateError(ENTITY, current.error);
    const nextAttempts = (current.data.attempts ?? 0) + 1;

    const { data, error } = await this.client
      .from(ENTITY)
      .update({ attempts: nextAttempts })
      .eq("id", id)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    return data;
  }

  /**
   * List queued email notifications ready to be sent (oldest first, attempts < 3).
   */
  async listPending(limit = 50) {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("status", "queued")
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  /**
   * Count sent emails (for dashboard).
   */
  async countSent(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true })
      .eq("status", "sent");

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  /**
   * Count failed emails (for dashboard).
   */
  async countFailed(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }
}

/**
 * Repository for notification_settings table operations
 */
export class NotificationSettingsRepository {
  constructor(private client: AnySupabaseClient) {}

  static async create() {
    return new NotificationSettingsRepository(getSupabaseServiceClient());
  }

  /**
   * Get notification settings for a user (inserts defaults if missing).
   */
  async getOrCreate(userId: Uuid) {
    const { data, error } = await this.client
      .from("notification_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw translateError("notification_settings", error);

    if (data) return data;

    const inserted = await this.client
      .from("notification_settings")
      .insert({
        user_id: userId,
        email_enabled: true,
        weekly_digest_enabled: true,
      })
      .select()
      .single();

    if (inserted.error)
      throw translateError("notification_settings", inserted.error);
    return inserted.data;
  }

  /**
   * Update notification settings for a user.
   */
  async update(
    userId: Uuid,
    update: { email_enabled?: boolean; weekly_digest_enabled?: boolean },
  ) {
    const { data, error } = await this.client
      .from("notification_settings")
      .update(update)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw translateError("notification_settings", error);
    return data;
  }
}
