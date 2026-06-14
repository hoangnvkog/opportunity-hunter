/**
 * Opportunities API route
 * GET /api/opportunities
 * Returns list of opportunities with optional filters
 */

import { NextResponse } from "next/server";
import { findOpportunities } from "@/services/opportunities";

export async function GET() {
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
