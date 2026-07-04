/**
 * GET /api/venture-score/[opportunityId]
 *
 * Returns the complete Venture Score object for an opportunity.
 * Lazily calculates if not yet persisted.
 */
import { NextRequest, NextResponse } from "next/server";
import { getVentureScoreDetail } from "@/services/venture-score/venture-score.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> },
) {
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
