/**
 * Pipeline API route
 * POST /api/pipeline
 * Executes the complete Opportunity Hunter pipeline
 */

import { NextResponse } from "next/server";
import { requireUserAPI } from "@/lib/auth/api-guard";
import { runPipeline } from "@/services/pipeline";

// Pipeline runs 13 stages with AI calls. Vercel default maxDuration on
// Hobby is 10s → guarantees "FUNCTION_INVOCATION_TIMEOUT" mid-run.
// 300s = 5min, which covers a full pipeline with headroom.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST() {
  const guard = await requireUserAPI();
  if (!guard.ok) return guard.response;
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
