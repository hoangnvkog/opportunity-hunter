/**
 * GET /api/committee/[id]/export
 * Sprint 61 — export committee decision as Markdown / JSON.
 * Query: ?format=md | json
 */
import { NextResponse } from "next/server";
import { getCommitteeWithVotes } from "@/lib/services/committee.service";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const url = new URL(request.url);
    const format = (url.searchParams.get("format") ?? "md").toLowerCase();
    const data = await getCommitteeWithVotes(id);
    if (!data) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const { committee, votes } = data;

    if (format === "json") {
      return NextResponse.json({
        ok: true,
        data: { committee, votes },
      });
    }

    // Markdown default
    const lines: string[] = [];
    lines.push(`# Investment Committee Decision`);
    lines.push("");
    lines.push(`- Final Decision: **${committee.final_decision}**`);
    lines.push(`- Committee Score: ${committee.committee_score}`);
    lines.push(`- Confidence: ${committee.confidence}`);
    lines.push(`- Consensus: ${committee.consensus}`);
    lines.push(`- Votes: ${committee.votes_count}`);
    lines.push("");
    lines.push("## Agent Votes");
    lines.push("");
    for (const v of votes) {
      lines.push(`### ${v.agent_role}`);
      lines.push(`- Vote: **${v.vote}**`);
      lines.push(`- Score: ${v.score}`);
      lines.push(`- Confidence: ${v.confidence}`);
      lines.push(`- Weight: ${v.weight}`);
      lines.push("");
      lines.push(v.reasoning);
      lines.push("");
    }

    const content = lines.join("\n");
    if (format === "txt" || format === "md") {
      return new NextResponse(content, {
        headers: {
          "Content-Type": format === "txt" ? "text/plain" : "text/markdown",
          "Content-Disposition": `attachment; filename="committee-${committee.id}.${format === "txt" ? "txt" : "md"}"`,
        },
      });
    }

    return NextResponse.json({ ok: false, error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
