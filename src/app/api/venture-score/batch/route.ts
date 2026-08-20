/**
 * POST /api/venture-score/batch
 *
 * Batch-calculate venture scores for all opportunities.
 * Used by admin dashboard.
 */
import { NextResponse } from "next/server";
import { batchCalculateVentureScores } from "@/services/venture-score/venture-score.service";
import { requireUserAPI } from "@/lib/auth/api-guard";

export const dynamic = "force-dynamic";

// Batch venture score makes many OpenAI calls (one per opportunity). With
// the default 100-opportunity limit, this routinely exceeds Vercel Hobby's
// 10s default `maxDuration`. 300s gives a 5-minute budget which matches
// the pipeline-route precedent (Sprint 72 H1).
export const maxDuration = 300;

export async function POST() {
  const guard = await requireUserAPI();
  if (!guard.ok) return guard.response as NextResponse;
  try {
    const result = await batchCalculateVentureScores(100);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[api/venture-score/batch] error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
