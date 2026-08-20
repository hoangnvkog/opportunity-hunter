/**
 * GET /api/venture-score/[opportunityId]
 *
 * Returns the complete Venture Score object for an opportunity.
 * Lazily calculates if not yet persisted.
 */
import { NextRequest, NextResponse } from "next/server";
import { getVentureScoreDetail } from "@/services/venture-score/venture-score.service";
import { requireUserAPI } from "@/lib/auth/api-guard";

export const dynamic = "force-dynamic";

// Single-opportunity venture score invokes the OpenAI provider when the
// score is not yet cached. Use 60s budget — a single 7-dimension scoring
// call rarely exceeds 30s, but a cold start on Vercel Hobby can stretch
// that. 60s is a safe ceiling that still trips the per-page timeout
// faster than the whole 300s we reserve for batch/pipeline endpoints.
export const maxDuration = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> },
) {
  const guard = await requireUserAPI();
  if (!guard.ok) return guard.response;
  try {
    const { opportunityId } = await params;

    if (!opportunityId) {
      return NextResponse.json(
        { error: "opportunityId is required" },
        { status: 400 },
      );
    }

    const detail = await getVentureScoreDetail(opportunityId);

    if (!detail) {
      return NextResponse.json(
        { error: "Opportunity not found or scoring failed" },
        { status: 404 },
      );
    }

    return NextResponse.json(detail, { status: 200 });
  } catch (err) {
    console.error("[api/venture-score] error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
