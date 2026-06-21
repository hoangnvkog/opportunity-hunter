/**
 * System Service - Health monitoring and scheduler status
 */

import { PipelineRunsRepository } from "@/lib/db/repositories";
import { getSchedulerStatus } from "@/lib/scheduler/scheduler";
import { isPipelineRunning } from "@/lib/scheduler/pipeline-job";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";

/**
 * Pipeline health status
 */
export interface PipelineHealth {
  isSchedulerRunning: boolean;
  isPipelineRunning: boolean;
  schedulerSchedule: string | null;
  nextExecution: string | null;
  lastRun: PipelineRunHistory | null;
  successRate: number;
  totalRuns: number;
  successCount: number;
  failedCount: number;
}

/**
 * Get the last pipeline run
 */
export async function getLastPipelineRun(): Promise<PipelineRunHistory | null> {
  try {
    const repository = await PipelineRunsRepository.create();
    const runs = await repository.listLatest(1);
    return runs.length > 0 ? runs[0] : null;
  } catch (error) {
    console.error("Failed to get last pipeline run:", error);
    return null;
  }
}

/**
 * Calculate pipeline success rate
 */
export async function getSuccessRate(): Promise<{
  rate: number;
  total: number;
  success: number;
  failed: number;
}> {
  try {
    const repository = await PipelineRunsRepository.create();
    const allRuns = await repository.listLatest(100); // Last 100 runs
    
    const total = allRuns.length;
    const success = allRuns.filter(r => r.status === "success").length;
    const failed = allRuns.filter(r => r.status === "failed").length;
    const rate = total > 0 ? (success / total) * 100 : 0;
    
    return {
      rate: Math.round(rate * 100) / 100, // 2 decimal places
      total,
      success,
      failed,
    };
  } catch (error) {
    console.error("Failed to calculate success rate:", error);
    return {
      rate: 0,
      total: 0,
      success: 0,
      failed: 0,
    };
  }
}

/**
 * Get comprehensive pipeline health status
 */
export async function getPipelineHealth(): Promise<PipelineHealth> {
  const [schedulerStatus, lastRun, successStats] = await Promise.all([
    getSchedulerStatus(),
    getLastPipelineRun(),
    getSuccessRate(),
  ]);
  
  return {
    isSchedulerRunning: schedulerStatus.isRunning,
    isPipelineRunning: isPipelineRunning(),
    schedulerSchedule: schedulerStatus.jobConfig?.schedule || null,
    nextExecution: schedulerStatus.nextExecution,
    lastRun,
    successRate: successStats.rate,
    totalRuns: successStats.total,
    successCount: successStats.success,
    failedCount: successStats.failed,
  };
}

/**
 * Get scheduler status for dashboard display
 */
export function getSchedulerDisplayStatus(): {
  isRunning: boolean;
  schedule: string | null;
  nextExecution: string | null;
  startedAt: string | null;
} {
  const status = getSchedulerStatus();
  
  return {
    isRunning: status.isRunning,
    schedule: status.jobConfig?.schedule || null,
    nextExecution: status.nextExecution,
    startedAt: status.startedAt,
  };
}
