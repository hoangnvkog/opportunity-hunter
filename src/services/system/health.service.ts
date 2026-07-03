/**
 * Health Service - System health monitoring
 * 
 * Provides health status checks for the entire system.
 */

import { PipelineRunsRepository } from "@/lib/db/repositories";
import { isSchedulerRunning, isPipelineRunning } from "@/lib/scheduler";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface HealthStatus {
  database: "healthy" | "unhealthy";
  scheduler: "running" | "stopped";
  pipeline: "idle" | "executing" | "failed";
  lastCheck: string;
  details?: Record<string, unknown>;
}

/**
 * Get comprehensive system health status
 * 
 * @returns HealthStatus object with all system components
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const lastCheck = new Date().toISOString();
  
  // Check database health
  const database = await checkDatabaseHealth();
  
  // Check scheduler status
  const scheduler = isSchedulerRunning() ? "running" : "stopped";
  
  // Check pipeline status
  const pipeline = await checkPipelineStatus();
  
  return {
    database,
    scheduler,
    pipeline,
    lastCheck,
    details: {
      timestamp: lastCheck,
      environment: process.env.NODE_ENV || "development",
    },
  };
}

/**
 * Check database connectivity and health
 */
async function checkDatabaseHealth(): Promise<"healthy" | "unhealthy"> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Simple query to verify database connectivity
    const { error } = await supabase
      .from("sources")
      .select("id")
      .limit(1);
    
    return error ? "unhealthy" : "healthy";
  } catch (error) {
    console.error("Database health check failed:", error);
    return "unhealthy";
  }
}

/**
 * Check pipeline execution status
 */
async function checkPipelineStatus(): Promise<"idle" | "executing" | "failed"> {
  // If currently running, return executing
  if (isPipelineRunning()) {
    return "executing";
  }
  
  try {
    // Check last pipeline run status
    const repository = await PipelineRunsRepository.create();
    const runs = await repository.listLatest(1);
    
    if (runs.length === 0) {
      return "idle";
    }
    
    const lastRun = runs[0];
    
    // If last run failed, return failed status
    if (lastRun.status === "failed") {
      return "failed";
    }
    
    return "idle";
  } catch (error) {
    console.error("Pipeline status check failed:", error);
    return "idle";
  }
}
