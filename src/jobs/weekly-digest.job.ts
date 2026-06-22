/**
 * Weekly digest cron entry point.
 *
 * Run with:
 *   tsx src/jobs/weekly-digest.job.ts
 *
 * Production usage (Vercel Cron / external scheduler):
 *   1. Imports `runWeeklyDigestJob()` from `@/lib/scheduler`.
 *   2. Calls it via the HTTP route at `/api/jobs/weekly-digest` (companion
 *      route handles overlap prevention and re-uses the same module).
 */

import { runWeeklyDigestJob } from "@/lib/scheduler/weekly-digest-job";

async function main() {
  try {
    console.log(`[${new Date().toISOString()}] Weekly digest cron starting…`);
    const result = await runWeeklyDigestJob();
    if (result) {
      console.table({
        eligible_users: result.eligible_users,
        queued: result.queued,
        sent: result.sent,
        failed: result.failed,
      });
    }
    console.log("✅ Weekly digest cron complete");
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Weekly digest cron failed:`);
    console.error(error);
    process.exit(1);
  }
}

void main();
