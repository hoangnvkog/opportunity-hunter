/**
 * GET /api/committee/[id]  — fetch committee by committee ID (Sprint 61 compat)
 * POST /api/committee/[id] — run committee for opportunity [id] (Sprint 67)
 */
import { NextRequest, NextResponse } from "next/server";
import { getCommitteeWithVotes } from "@/lib/services/committee.service";
import {
  runInvestmentCommittee,
} from "@/services/investment-committee/committee.service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    // Sprint 61: GET by committee ID
    const data = await getCommitteeWithVotes(id);
    if (!data) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id: opportunityId } = await ctx.params;
    const committee = await runInvestmentCommittee(opportunityId);
    if (!committee) {
      return NextResponse.json(
        { ok: false, error: "Could not generate committee — opportunity not found" },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, data: committee }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}