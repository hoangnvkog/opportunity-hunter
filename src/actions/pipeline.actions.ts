/**
 * Pipeline server actions
 * Next.js server actions for pipeline execution
 */

"use server";

import { runPipeline } from "@/services/pipeline";

/**
 * Execute the complete Opportunity Hunter pipeline
 * Server action wrapper for runPipeline()
 * 
 * @returns Pipeline execution results with counts for each stage
 */
export async function runPipelineAction() {
  return await runPipeline();
}
