import { NextResponse } from "next/server";
import { runFullPipeline } from "@/services/pipeline/run-full-pipeline.service";
import type { PipelineRunResponse } from "@/types/pipeline-run";

export async function POST(): Promise<NextResponse<PipelineRunResponse>> {
  try {
    const stats = await runFullPipeline();
    return NextResponse.json(
      {
        success: true,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Check if it's a concurrency error
    if (message === "Pipeline already running") {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 409 }
      );
    }

    // Other errors
    console.error("Pipeline execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Pipeline execution failed: ${message}`,
      },
      { status: 500 }
    );
  }
}
