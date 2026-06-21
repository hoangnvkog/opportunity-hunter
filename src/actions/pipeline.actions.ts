/**
 * Pipeline server actions
 * Next.js server actions for pipeline execution
 */

"use server";

import { runPipeline } from "@/services/pipeline/pipeline.service";
import { triggerPipelineNow, getSchedulerStatus } from "@/lib/scheduler";
import { getHealthStatus } from "@/services/system/health.service";
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

/**
 * Manually trigger pipeline execution via scheduler
 * Prevents overlapping runs
 */
export async function triggerPipelineAction(): Promise<PipelineActionResult> {
  try {
    const result = await triggerPipelineNow();
    if (!result) {
      return {
        success: false,
        error: "Pipeline is already running",
      };
    }
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Pipeline trigger failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Pipeline trigger failed",
    };
  }
}

/**
 * Get current scheduler status
 */
export async function getSchedulerStatusAction(): Promise<{
  isRunning: boolean;
  lastRun: string | null;
  nextRun: string | null;
  isExecuting: boolean;
}> {
  const status = getSchedulerStatus();
  return {
    isRunning: status.isRunning,
    lastRun: null, // Will be fetched from database
    nextRun: status.nextExecution,
    isExecuting: false, // Will check from pipeline-job
  };
}

/**
 * Get system health status
 */
export async function getHealthStatusAction(): Promise<{
  database: "healthy" | "unhealthy";
  scheduler: "running" | "stopped";
  pipeline: "idle" | "executing" | "failed";
  lastCheck: string;
  details?: Record<string, unknown>;
}> {
  return getHealthStatus();
}
