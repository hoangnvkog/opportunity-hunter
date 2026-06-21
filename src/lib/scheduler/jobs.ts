/**
 * Scheduler Jobs - Cron job definitions
 * 
 * Defines various scheduling options for pipeline execution.
 */

import { runPipelineJob } from "./pipeline-job";

/**
 * Job configuration
 */
export interface JobConfig {
  name: string;
  schedule: string; // Cron expression
  timezone?: string;
}

/**
 * Predefined job schedules
 */
export const JOB_SCHEDULES = {
  EVERY_HOUR: "0 * * * *",
  EVERY_6_HOURS: "0 */6 * * *",
  DAILY: "0 0 * * *",
  WEEKLY: "0 0 * * 0",
} as const;

/**
 * Create a job handler that executes the pipeline
 */
export function createJobHandler(config: JobConfig): () => Promise<void> {
  return async () => {
    console.log(`\n🕐 [${config.name}] Scheduled execution triggered at ${new Date().toISOString()}`);
    
    try {
      const result = await runPipelineJob();
      
      if (result === null) {
        console.log(`⚠️  [${config.name}] Skipped - pipeline already running`);
      } else {
        console.log(`✅ [${config.name}] Completed successfully`);
      }
    } catch (error) {
      console.error(`❌ [${config.name}] Failed:`, error);
      // Don't throw - let scheduler continue with next execution
    }
  };
}

/**
 * Run pipeline every hour
 */
export function runEveryHour(): JobConfig {
  return {
    name: "Hourly Pipeline",
    schedule: JOB_SCHEDULES.EVERY_HOUR,
    timezone: "UTC",
  };
}

/**
 * Run pipeline every 6 hours (default)
 */
export function runEvery6Hours(): JobConfig {
  return {
    name: "6-Hour Pipeline",
    schedule: JOB_SCHEDULES.EVERY_6_HOURS,
    timezone: "UTC",
  };
}

/**
 * Run pipeline daily at midnight
 */
export function runDaily(): JobConfig {
  return {
    name: "Daily Pipeline",
    schedule: JOB_SCHEDULES.DAILY,
    timezone: "UTC",
  };
}

/**
 * Run pipeline weekly on Sunday at midnight
 */
export function runWeekly(): JobConfig {
  return {
    name: "Weekly Pipeline",
    schedule: JOB_SCHEDULES.WEEKLY,
    timezone: "UTC",
  };
}

/**
 * Get job config from environment variable
 * 
 * @returns JobConfig based on PIPELINE_SCHEDULE env var
 */
export function getJobConfigFromEnv(): JobConfig {
  const schedule = process.env.PIPELINE_SCHEDULE || JOB_SCHEDULES.EVERY_6_HOURS;
  
  // Determine name based on schedule
  let name = "Custom Pipeline";
  if (schedule === JOB_SCHEDULES.EVERY_HOUR) name = "Hourly Pipeline";
  else if (schedule === JOB_SCHEDULES.EVERY_6_HOURS) name = "6-Hour Pipeline";
  else if (schedule === JOB_SCHEDULES.DAILY) name = "Daily Pipeline";
  else if (schedule === JOB_SCHEDULES.WEEKLY) name = "Weekly Pipeline";
  
  return {
    name,
    schedule,
    timezone: process.env.PIPELINE_TIMEZONE || "UTC",
  };
}
