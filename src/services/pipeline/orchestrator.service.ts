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
  if (isRunning) {
    throw new Error("Pipeline already running");
  }

  isRunning = true;
  const startedAt = new Date().toISOString();
  const repo = await PipelineRunsRepository.create();

  // Create initial "running" record
  let runId: string;
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
    runId = runRecord.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Orchestrator] Failed to create pipeline run record: ${message}`);
    isRunning = false;
    throw new Error(`Failed to create pipeline run record: ${message}`);
  }

  console.info(`[Orchestrator] Pipeline run ${runId} started at ${startedAt}`);

  try {
    // Execute the core pipeline
    const result: PipelineRunResult = await runPipelineCore();
    const finishedAt = new Date().toISOString();
    const durationMs = Math.round(
      new Date(finishedAt).getTime() - new Date(startedAt).getTime()
    );

    // Update success record with final counts
    await repo.update(runId, {
      finished_at: finishedAt,
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

    // Update failure record
    try {
      await repo.update(runId, {
        finished_at: finishedAt,
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
