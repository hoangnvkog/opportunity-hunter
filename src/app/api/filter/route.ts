/**
 * Filter API route.
 *
 * GET /api/filter?minScore=&minFrequency=&minSeverity=&minBuyingIntent=&limit=&search=
 *
 * Returns opportunities + startup ideas filtered by the supplied
 * numeric thresholds. Mirrors the contract used by the
 * FilterPanel on the dashboard.
 *
 * All numeric parameters are optional. Strings that fail
 * `parseFloat` are silently ignored so the route is forgiving
 * about manually-typed query strings.
 */

import { NextResponse } from "next/server";
import {
  getFilteredOpportunities,
  getFilteredStartupIdeas,
} from "@/services/dashboard/dashboard.service";
import type { OpportunityFilters } from "@/types/filters";

function parseOptionalFloat(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

function clampLimit(raw: string | null): number {
  if (!raw) return 10;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return 10;
  return Math.min(100, Math.max(1, n));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const opportunityFilters: OpportunityFilters = {
      minScore: parseOptionalFloat(searchParams.get("minScore")),
      minFrequency: parseOptionalFloat(searchParams.get("minFrequency")),
      minSeverity: parseOptionalFloat(searchParams.get("minSeverity")),
      minBuyingIntent: parseOptionalFloat(searchParams.get("minBuyingIntent")),
      search: searchParams.get("search") ?? undefined,
      limit: clampLimit(searchParams.get("limit")),
    };

    const [opportunities, ideas] = await Promise.all([
      getFilteredOpportunities(opportunityFilters),
      getFilteredStartupIdeas({
        search: opportunityFilters.search,
        limit: opportunityFilters.limit,
      }),
    ]);

    return NextResponse.json({ opportunities, ideas });
  } catch (error) {
    console.error("Filter API error:", error);
    return NextResponse.json(
      { error: "Failed to apply filters" },
      { status: 500 },
    );
  }
}
