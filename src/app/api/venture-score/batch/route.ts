/**
 * POST /api/venture-score/batch
 *
 * Batch-calculate venture scores for all opportunities.
 * Used by admin dashboard.
 */
import { NextResponse } from "next/server";
import { batchCalculateVentureScores } from "@/services/venture-score/venture-score.service";
import { requireUserAPI } from "@/lib/auth/api-guard";

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
