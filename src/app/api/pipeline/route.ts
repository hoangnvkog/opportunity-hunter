/**
 * Pipeline API route
 * POST /api/pipeline
 * Executes the complete Opportunity Hunter pipeline
 */

import { NextResponse } from "next/server";
import { runPipeline } from "@/services/pipeline";

export async function POST() {
  try {
    const result = await runPipeline();

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Pipeline API error:", error);
    const message = error instanceof Error ? error.message : "Pipeline execution failed";
    
    return NextResponse.json(
      { 
        success: false,
        error: message 
      },
      { status: 500 }
    );
  }
}
