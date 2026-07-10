/**
 * Search API route.
 *
 * GET /api/search?q=<query>&limit=<n>
 *
 * Returns matched opportunities AND startup ideas for a free-text query.
 * Both lists use the same `search` filter the dashboard already exposes
 * via `getFilteredOpportunities` / `getFilteredStartupIdeas`, so the
 * semantics here are exactly what the DashboardFiltersClient expects.
 *
 * Notes:
 *  - `q` is optional; an empty query returns the most recent N records
 *    (used when the SearchBar is cleared).
 *  - `limit` defaults to 10 and is clamped to [1, 100].
 *  - The route never throws — errors are logged and returned as 500.
 */

import { NextResponse } from "next/server";
import {
  getFilteredOpportunities,
  getFilteredStartupIdeas,
} from "@/services/dashboard/dashboard.service";

function clampLimit(raw: string | null): number {
  if (!raw) return 10;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return 10;
  return Math.min(100, Math.max(1, n));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limit = clampLimit(searchParams.get("limit"));

    const [opportunities, ideas] = await Promise.all([
      getFilteredOpportunities({ search: q || undefined, limit }),
      getFilteredStartupIdeas({ search: q || undefined, limit }),
    ]);

    return NextResponse.json({ opportunities, ideas });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 },
    );
  }
}
