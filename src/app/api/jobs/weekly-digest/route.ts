/**
 * Weekly digest cron route.
 *
 * POST /api/jobs/weekly-digest — invoked by Vercel Cron (or equivalent)
 * on a Monday-morning cadence. Re-uses `runWeeklyDigestJob` so the job
 * stays idempotent and overlap-safe across multiple invocations.
 */

import { NextResponse } from "next/server";
import { runWeeklyDigestJob } from "@/lib/scheduler/weekly-digest-job";
import { requireCronSecret } from "@/lib/auth/api-guard";

export async function POST(request: Request) {
  const guard = await requireCronSecret(request);
  if (!guard.ok) return guard.response;
  try {
    const result = await runWeeklyDigestJob();
    if (!result) {
      return NextResponse.json(
        { success: false, message: "Already running" },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Weekly digest API error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
