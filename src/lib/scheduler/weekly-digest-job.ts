/**
 * Weekly Digest Job
 *
 * Two-step executor called every Monday morning UTC (week_start):
 *   1. Queue one digest per eligible user (settings.weekly_digest_enabled).
 *   2. Process the queue once (render → send → mark sent/failed).
 *
 * Subsequent queue drain happens in `sendPendingDigests()` on the
 * service; the cron worker is intentionally idempotent so multiple
 * invocations within the same week don't pile up duplicate sends.
 */

import { getSupabaseServerClient } from "@/lib/supabase";
import { WeeklyDigestService } from "@/services/digests/weekly-digest.service";

let isRunning = false;

export interface WeeklyDigestRunResult {
  eligible_users: number;
  queued: number;
  sent: number;
  failed: number;
}

/**
 * Execute the weekly digest job with overlap prevention.
 */
export async function runWeeklyDigestJob(): Promise<WeeklyDigestRunResult | null> {
  if (isRunning) {
    console.log("⚠️  Weekly digest already running. Skipping tick.");
    return null;
  }

  isRunning = true;
  const startedAt = new Date().toISOString();

  console.log("\n" + "=".repeat(60));
  console.log("📬 WEEKLY DIGEST STARTED");
  console.log("⏰ Started at:", startedAt);
  console.log("=".repeat(60) + "\n");

  try {
    const service = await WeeklyDigestService.create();

    // Phase 1: queue for every user who has digests enabled.
    const eligible = await listEligibleUserIds();
    let queued = 0;

    for (const userId of eligible) {
      const id = await service.queueDigest(userId);
      if (id) queued++;
    }

    console.log(`📝 Queued ${queued}/${eligible.length} digests`);

    // Phase 2: send any pending digests (this run + leftover from prior ticks).
    const drain = await service.sendPendingDigests();
    console.log(`📤 Sent ${drain.sent}, failed ${drain.failed}`);

    const result: WeeklyDigestRunResult = {
      eligible_users: eligible.length,
      queued,
      sent: drain.sent,
      failed: drain.failed,
    };

    console.log("\n" + "=".repeat(60));
    console.log("✅ WEEKLY DIGEST COMPLETED");
    console.log("=".repeat(60) + "\n");

    return result;
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ WEEKLY DIGEST FAILED");
    console.error("💥 Error:", error instanceof Error ? error.message : String(error));
    console.error("=".repeat(60) + "\n");
    throw error;
  } finally {
    isRunning = false;
  }
}

/**
 * Returns true when the job is currently executing.
 */
export function isWeeklyDigestRunning(): boolean {
  return isRunning;
}

/**
 * Resolve the set of user ids that have `weekly_digest_enabled = true`.
 *
 * Backed by an admin-level client so service-role callers (cron, scripts)
 * can fan-out across all users without needing each user to be signed in.
 */
async function listEligibleUserIds(): Promise<string[]> {
  const client = await getSupabaseServerClient();
  const { data, error } = await client
    .from("notification_settings")
    .select("user_id, weekly_digest_enabled")
    .eq("weekly_digest_enabled", true);

  if (error) {
    console.error("Failed to load eligible users:", error);
    return [];
  }

  return (data ?? []).map((row) => row.user_id);
}
