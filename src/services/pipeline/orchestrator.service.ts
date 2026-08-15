/**
 * Pipeline Orchestrator Service
 *
 * Wraps the runner pipeline with execution tracking, concurrency control,
 * and persistent history in pipeline_runs table.
 */

import { runPipeline as runPipelineCore } from "./runner.service";
import type { PipelineRunResult } from "./runner.service";
import { PipelineRunsRepository } from "@/lib/db/repositories/pipeline-runs.repository";

let isRunning = false;

/**
 * Try to recover any stuck 'running' pipeline runs from previous crashes.
 * Runs older than 30 minutes are considered abandoned and marked as failed.
 * This lets a fresh pipeline start even if the previous process died
 * mid-execution.
 */
async function recoverStuckRuns(): Promise<void> {
  try {
    const repo = await PipelineRunsRepository.create();
    const stuck = await repo.findStuckRunning(30);
    if (stuck.length === 0) return;

    console.warn(
      `[Orchestrator] Recovering ${stuck.length} stuck pipeline run(s) from previous crash`
    );
    for (const run of stuck) {
      try {
        await repo.markStuckAsFailed(
          run.id,
          `Pre-existing running row recovered after > 30m (started ${run.started_at})`
        );
      } catch (err) {
        console.error(
          `[Orchestrator] Failed to mark stuck run ${run.id} as failed:`,
          err
        );
      }
    }
  } catch (err) {
    console.error(`[Orchestrator] Stuck-run recovery skipped:`, err);
  }
}

export interface PipelineExecutionResult {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  rawPosts: number;
  painPoints: number;
  clusters: number;
  opportunities: number;
  ideas: number;
  success: boolean;
  errorMessage: string | null;
  runId: string;
}

/**
 * Execute the complete pipeline with execution tracking.
 *
 * - Prevents concurrent runs via in-memory lock
 * - Creates a pipeline_runs record before starting
 * - Updates the record on completion (success or failure)
 * - Returns an execution summary
 */
export async function runPipelineWithTracking(): Promise<PipelineExecutionResult> {
  const { runId, startedAt } = await createPipelineRunRecord();
  return executePipelineRun(runId, startedAt);
}

/**
 * Create a tracked pipeline run without waiting for the expensive AI pipeline.
 * Useful for Server Actions on Vercel Hobby: the UI gets a fast structured
 * response, while Next.js `after()`/Vercel keeps the background work alive.
 */
export async function createPipelineRunRecord(): Promise<{ runId: string; startedAt: string }> {
  if (isRunning) {
    throw new Error("Pipeline already running");
  }

  // Auto-recover any stuck 'running' rows from previous crashes so that
  // a crashed run doesn't permanently block subsequent executions.
  await recoverStuckRuns();

  isRunning = true;
  const startedAt = new Date().toISOString();
  const repo = await PipelineRunsRepository.create();

  try {
    const runRecord = await repo.create({
      started_at: startedAt,
      finished_at: startedAt,
      duration_ms: 0,
      sources: 0,
      raw_posts: 0,
      pain_points: 0,
      embeddings: 0,
      clusters: 0,
      opportunities: 0,
      startup_ideas: 0,
      status: "running",
      error_message: null,
    });

    console.info(`[Orchestrator] Pipeline run ${runRecord.id} started at ${startedAt}`);
    return { runId: runRecord.id, startedAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Orchestrator] Failed to create pipeline run record: ${message}`);
    isRunning = false;
    throw new Error(`Failed to create pipeline run record: ${message}`);
  }
}

/**
 * Execute the expensive pipeline work for an already-created run record.
 */
export async function executePipelineRun(
  runId: string,
  startedAt: string,
): Promise<PipelineExecutionResult> {
  const repo = await PipelineRunsRepository.create();

  try {
    const result: PipelineRunResult = await runPipelineCore();
    const finishedAt = new Date().toISOString();
    const durationMs = Math.round(
      new Date(finishedAt).getTime() - new Date(startedAt).getTime()
    );

    await repo.update(runId, {
      finished_at: finishedAt,
      duration_ms: durationMs,
      sources: result.sources,
      raw_posts: result.rawPosts,
      pain_points: result.painPoints,
      embeddings: result.embeddings,
      clusters: result.clusters,
      opportunities: result.opportunities,
      startup_ideas: result.ideas,
      status: "success",
      error_message: null,
    });

    console.info(`[Orchestrator] Pipeline run ${runId} completed successfully in ${durationMs}ms`);
    console.info(`[Orchestrator] Results: ${result.rawPosts} posts, ${result.painPoints} pain points, ${result.clusters} clusters, ${result.opportunities} opportunities, ${result.ideas} ideas`);

    return {
      startedAt,
      finishedAt,
      durationMs,
      rawPosts: result.rawPosts,
      painPoints: result.painPoints,
      clusters: result.clusters,
      opportunities: result.opportunities,
      ideas: result.ideas,
      success: true,
      errorMessage: null,
      runId,
    };
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const durationMs = Math.round(
      new Date(finishedAt).getTime() - new Date(startedAt).getTime()
    );
    const errorMessage = err instanceof Error ? err.message : String(err);

    console.error(`[Orchestrator] Pipeline run ${runId} failed: ${errorMessage}`);

    try {
      await repo.update(runId, {
        finished_at: finishedAt,
        duration_ms: durationMs,
        status: "failed",
        error_message: errorMessage,
      });
    } catch (updateErr) {
      console.error(`[Orchestrator] Failed to update failure record: ${updateErr}`);
    }

    return {
      startedAt,
      finishedAt,
      durationMs,
      rawPosts: 0,
      painPoints: 0,
      clusters: 0,
      opportunities: 0,
      ideas: 0,
      success: false,
      errorMessage,
      runId,
    };
  } finally {
    isRunning = false;
  }
}

/**
 * Check if a pipeline run is currently in progress.
 */
export function isPipelineRunning(): boolean {
  return isRunning;
}

/**
 * Get latest pipeline execution result from history.
 */
export async function getLatestExecution(): Promise<{
  lastRun: string | null;
  lastStatus: string | null;
  lastDurationMs: number | null;
  rawPosts: number;
  painPoints: number;
  clusters: number;
  opportunities: number;
  ideas: number;
} | null> {
  const repo = await PipelineRunsRepository.create();
  const latest = await repo.latest();

  if (!latest) return null;

  return {
    lastRun: latest.finished_at || latest.started_at,
    lastStatus: latest.status,
    lastDurationMs: latest.duration_ms,
    rawPosts: latest.raw_posts,
    painPoints: latest.pain_points,
    clusters: latest.clusters,
    opportunities: latest.opportunities,
    ideas: latest.startup_ideas,
  };
}
