/**
 * GET /api/committee/[id]  — fetch committee by committee ID (Sprint 61 compat)
 * POST /api/committee/[id] — run committee for opportunity [id] (Sprint 67)
 */
import { NextRequest, NextResponse } from "next/server";
import { getCommitteeWithVotes } from "@/lib/services/committee.service";
import {
  runInvestmentCommittee,
} from "@/services/investment-committee/committee.service";
import { requireUserAPI } from "@/lib/auth/api-guard";

export const dynamic = "force-dynamic";

// Committee POST runs 5 AI agents in sequence (Market, Product, Financial,
// Technical, VC Partner). Each agent makes an OpenAI call → 60–120s budget
// for the whole committee. Vercel Hobby default `maxDuration=10s` would
// guarantee a 504 mid-run. 300s covers a full 5-agent committee with
// headroom; matches the pipeline-route precedent (Sprint 72 H1).
export const maxDuration = 300;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireUserAPI();
  if (!guard.ok) return guard.response;
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
  const guard = await requireUserAPI();
  if (!guard.ok) return guard.response;
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