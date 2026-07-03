/**
 * GET /api/research/jobs
 * List research jobs with optional filtering.
 * Query parameters:
 *   - status: filter by status (pending, running, completed, failed, cancelled)
 *   - source: filter by source (reddit, github, hackernews, producthunt, rss, all)
 *   - limit: number of results to return (default 50)
 *   - offset: offset for pagination (default 0)
 */
import { NextResponse } from "next/server";
import { listResearchJobs, startResearch } from "@/lib/services/research-agent.service";
import type { ResearchJobStatus, ResearchSourceName } from "@/types/research-job";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusRaw = url.searchParams.get("status");
    const sourceRaw = url.searchParams.get("source");
    const status = statusRaw ? (statusRaw as ResearchJobStatus) : undefined;
    const source = sourceRaw ? (sourceRaw as ResearchSourceName) : undefined;
    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    const jobs = await listResearchJobs({ status, source, limit, offset });
    return NextResponse.json({ ok: true, data: jobs, count: jobs.length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/research/jobs
 * Start a new research job.
 * Body: { source: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source } = body;

    if (!source) {
      return NextResponse.json(
        { ok: false, error: "Source is required" },
        { status: 400 }
      );
    }

    const job = await startResearch(source as ResearchSourceName);
    return NextResponse.json({ ok: true, data: job });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}