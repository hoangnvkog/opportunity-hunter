/**
 * GET /api/committee/[id]
 * Sprint 61 — AI Investment Committee detail.
 */
import { NextResponse } from "next/server";
import { getCommitteeWithVotes } from "@/lib/services/committee.service";

export async function GET(_request: Request, ctx: { params: { id: string } }) {
  try {
    const data = await getCommitteeWithVotes(ctx.params.id);
    if (!data) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
