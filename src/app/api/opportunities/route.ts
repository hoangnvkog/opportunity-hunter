/**
 * Opportunities API route
 * GET /api/opportunities
 * Returns list of opportunities with optional filters
 */

import { NextResponse } from "next/server";
import { findOpportunities } from "@/services/opportunities";
import { requireUserAPI } from "@/lib/auth/api-guard";

export async function GET() {
  const guard = await requireUserAPI();
  if (!guard.ok) return guard.response;
  try {
    const opportunities = await findOpportunities();

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Opportunities API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
