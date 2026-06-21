/**
 * Pipeline server actions
 * Next.js server actions for pipeline execution
 */

"use server";

import { runPipeline } from "@/services/pipeline/pipeline.service";
import type { PipelineRunResult } from "@/types/pipeline-run";

export interface PipelineActionResult {
  success: boolean;
  data?: PipelineRunResult;
  error?: string;
}

/**
 * Execute the complete Opportunity Hunter pipeline
 * Server action wrapper for runPipeline()
 */
export async function runPipelineAction(): Promise<PipelineActionResult> {
  try {
    const result = await runPipeline();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Pipeline failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Pipeline failed",
    };
  }
}
