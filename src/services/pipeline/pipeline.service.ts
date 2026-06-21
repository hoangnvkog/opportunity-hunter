/**
 * Pipeline service for manual execution
 */

import { runPipeline as runPipelineRunner } from "./runner.service";
import type { PipelineRunResult } from "@/types/pipeline-run";

/**
 * Execute the complete pipeline with duration tracking
 */
export async function runPipeline(): Promise<PipelineRunResult> {
  const startTime = Date.now();
  
  const result = await runPipelineRunner();
  
  const durationMs = Date.now() - startTime;
  
  return {
    rawPosts: result.rawPosts,
    painPoints: result.painPoints,
    clusters: result.clusters,
    opportunities: result.opportunities,
    startupIdeas: result.ideas,
    durationMs,
  };
}
