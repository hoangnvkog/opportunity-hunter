/**
 * GET /api/committee/search
 * Sprint 61 — AI Investment Committee
 * Search committees with filters.
 */
import { NextResponse } from "next/server";
import { listCommittees } from "@/lib/services/committee.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const finalDecision = url.searchParams.get("finalDecision") ?? undefined;
    const minScore = url.searchParams.get("minCommitteeScore");
    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    const rows = await listCommittees({
      finalDecision,
      minCommitteeScore: minScore ? parseFloat(minScore) : undefined,
      limit,
      offset,
    });
    return NextResponse.json({ ok: true, data: rows, count: rows.length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
