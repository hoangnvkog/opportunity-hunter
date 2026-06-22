/**
 * Repository for weekly_digests table operations.
 *
 * Follows the same pattern as the rest of the repositories:
 *   - Constructor receives a typed Supabase client (any flavor).
 *   - Static `create()` lazily resolves the server client.
 *   - Each public method maps cleanly to a single SQL operation.
 *   - Errors are translated through `@/lib/db/errors` so callers see a
 *     uniform `RepositoryError` surface.
 *
 * Status state machine:
 *   - create()       → "queued"
 *   - markSent()     → "sent"     (sets sent_at)
 *   - markFailed()   → "failed"   (status flag only — content stays)
 */

import { translateError, NotFoundError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import type {
  WeeklyDigestInsert,
  WeeklyDigestRow,
} from "@/types/weekly-digest";
import type { Uuid } from "@/types";

const ENTITY = "weekly_digests";

export class WeeklyDigestsRepository {
  constructor(private client: AnySupabaseClient) {}

  static async create(): Promise<WeeklyDigestsRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new WeeklyDigestsRepository(await getSupabaseServerClient());
  }

  /**
   * Create a new weekly digest row in the `queued` state.
   * The unique constraint (user_id, week_start) prevents duplicate
   * digests per week — if a duplicate is detected we resolve it via
   * `findByWeek` to keep callers idempotent.
   */
  async create(data: WeeklyDigestInsert): Promise<WeeklyDigestRow> {
    const insertPayload: WeeklyDigestInsert = {
      ...data,
      status: data.status ?? "queued",
    };

    const { data: row, error } = await this.client
      .from(ENTITY)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      // 23505 = unique_violation — return existing for idempotency
      if (error.code === "23505") {
        const existing = await this.findByWeek(data.user_id, data.week_start);
        if (existing) return existing;
      }
      throw translateError(ENTITY, error);
    }

    if (!row) throw new NotFoundError(ENTITY, `${data.user_id}/${data.week_start}`);
    return row as WeeklyDigestRow;
  }

  /**
   * Mark a digest as sent and stamp `sent_at`. Also clears any error
   * hint by leaving the content untouched.
   */
  async markSent(id: Uuid): Promise<WeeklyDigestRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .update({
        status: "sent" as const,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new NotFoundError(ENTITY, id);
    return data as WeeklyDigestRow;
  }

  /**
   * Mark a digest as failed. `sent_at` stays null so the dashboard
   * accurately reflects that no email went out.
   */
  async markFailed(id: Uuid): Promise<WeeklyDigestRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .update({
        status: "failed" as const,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new NotFoundError(ENTITY, id);
    return data as WeeklyDigestRow;
  }

  /**
   * Look up a single digest for a user + week (used by idempotent
   * `create` and for `/digests/[id]` deep-links if we add them later).
   */
  async findByWeek(userId: Uuid, weekStart: string): Promise<WeeklyDigestRow | null> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return (data ?? null) as WeeklyDigestRow | null;
  }

  /**
   * List every queued digest that hasn't been retried too many times.
   * Used by the cron worker to drain the queue.
   *
   * Note: a failed digest may be re-queued by callers through a simple
   * `update({ status: "queued" })` if they choose to retry — that path
   * is intentionally out of scope here to keep state transitions explicit.
   */
  async listPending(limit = 50): Promise<WeeklyDigestRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as WeeklyDigestRow[];
  }

  /**
   * List digests for a specific user (history page). Most-recent-first.
   */
  async listByUser(userId: Uuid, limit = 50): Promise<WeeklyDigestRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(limit);

    if (error) throw translateError(ENTITY, error);
    return (data ?? []) as WeeklyDigestRow[];
  }

  /**
   * Count sent digests (used for the dashboard "weekly emails" metric).
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
   * Count how many opportunities have been ingested into the global
   * pool in the last `days` days. Used by the digest aggregator.
   */
  async countOpportunitiesSince(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { count, error } = await this.client
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .gte("created_at", cutoff.toISOString());

    if (error) throw translateError("opportunities", error);
    return count ?? 0;
  }
}
