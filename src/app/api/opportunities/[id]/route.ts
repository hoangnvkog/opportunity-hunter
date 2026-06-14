/**
 * Single Opportunity API route
 * GET /api/opportunities/[id]
 * Returns a specific opportunity by ID
 */

import { NextResponse } from "next/server";
import { getOpportunityById } from "@/services/opportunities";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const opportunity = await getOpportunityById(id);

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Opportunity API error:", error);
    
    // Check if it's a "not found" error
    if (error instanceof Error && error.message === "Opportunity not found") {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}
