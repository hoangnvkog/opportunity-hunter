/**
 * Scheduler - Cron-based pipeline automation
 * 
 * Manages scheduled pipeline execution with overlap prevention.
 */

import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import { createJobHandler, getJobConfigFromEnv, type JobConfig } from "./jobs";
import { isPipelineRunning, runPipelineJob } from "./pipeline-job";
import type { PipelineRunResult } from "@/types/pipeline-run";

/**
 * Scheduler state
 */
interface SchedulerState {
  isRunning: boolean;
  task: ScheduledTask | null;
  jobConfig: JobConfig | null;
  startedAt: string | null;
}

let state: SchedulerState = {
  isRunning: false,
  task: null,
  jobConfig: null,
  startedAt: null,
};

/**
 * Start the scheduler
 * 
 * @param config - Optional job config (defaults to env var or every 6 hours)
 */
export function startScheduler(config?: JobConfig): void {
  if (state.isRunning) {
    console.log("⚠️  Scheduler already running");
    return;
  }

  const jobConfig = config || getJobConfigFromEnv();
  
  console.log("\n" + "=".repeat(60));
  console.log("🕐 STARTING SCHEDULER");
  console.log("📅 Job:", jobConfig.name);
  console.log("⏰ Schedule:", jobConfig.schedule);
  console.log("🌍 Timezone:", jobConfig.timezone || "UTC");
  console.log("=".repeat(60) + "\n");

  // Validate cron expression
  if (!cron.validate(jobConfig.schedule)) {
    console.error("❌ Invalid cron expression:", jobConfig.schedule);
    return;
  }

  // Create job handler
  const handler = createJobHandler(jobConfig);

  // Schedule the job
  const task = cron.schedule(
    jobConfig.schedule,
    () => { handler(); },
    {
      timezone: jobConfig.timezone || "UTC",
    }
  );

  state = {
    isRunning: true,
    task,
    jobConfig,
    startedAt: new Date().toISOString(),
  };

  console.log("✅ Scheduler started successfully");
  console.log(`Next execution: ${getNextExecution(jobConfig.schedule)}`);
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (!state.isRunning || !state.task) {
    console.log("⚠️  Scheduler not running");
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("🛑 STOPPING SCHEDULER");
  console.log("=".repeat(60) + "\n");

  state.task.stop();
  
  state = {
    isRunning: false,
    task: null,
    jobConfig: null,
    startedAt: null,
  };

  console.log("✅ Scheduler stopped");
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  isRunning: boolean;
  jobConfig: JobConfig | null;
  startedAt: string | null;
  nextExecution: string | null;
} {
  return {
    isRunning: state.isRunning,
    jobConfig: state.jobConfig,
    startedAt: state.startedAt,
    nextExecution: state.jobConfig 
      ? getNextExecution(state.jobConfig.schedule)
      : null,
  };
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return state.isRunning;
}

/**
 * Get next execution time for a cron schedule
 * 
 * @param schedule - Cron expression
 * @returns ISO timestamp of next execution
 */
function getNextExecution(schedule: string): string {
  try {
    // node-cron doesn't expose next execution directly
    // We'll calculate it manually for common patterns
    const now = new Date();
    
    if (schedule === "0 * * * *") {
      // Every hour at minute 0
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      return next.toISOString();
    }
    
    if (schedule === "0 */6 * * *") {
      // Every 6 hours at minute 0
      const next = new Date(now);
      const currentHour = next.getHours();
      const nextHour = Math.ceil((currentHour + 1) / 6) * 6;
      next.setHours(nextHour, 0, 0, 0);
      return next.toISOString();
    }
    
    if (schedule === "0 0 * * *") {
      // Daily at midnight
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      return next.toISOString();
    }
    
    if (schedule === "0 0 * * 0") {
      // Weekly on Sunday at midnight
      const next = new Date(now);
      const daysUntilSunday = (7 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilSunday);
      next.setHours(0, 0, 0, 0);
      return next.toISOString();
    }
    
    // For custom schedules, return a generic message
    return "Check cron expression";
  } catch {
    return "Unable to calculate";
  }
}

/**
 * Trigger pipeline execution manually
 * 
 * @returns Pipeline run result or null if already running
 */
export async function triggerPipelineNow(): Promise<PipelineRunResult | null> {
  if (isPipelineRunning()) {
    console.log("⚠️  Pipeline already running");
    return null;
  }

  console.log("\n🔧 Manual pipeline execution triggered");
  
  return runPipelineJob();
}
