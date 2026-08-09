/**
 * Pipeline Server Actions
 *
 * Server-side API for triggering pipeline execution and viewing run history.
 */
"use server";

import { revalidatePath } from "next/cache";
import { PipelineRunsRepository } from "@/lib/db/repositories/pipeline-runs.repository";
import { runPipelineWithTracking, getLatestExecution } from "@/services/pipeline/orchestrator.service";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";
import { requireUserAPI } from "@/lib/auth/api-guard";

export async function runPipelineAction() {
  // Auth guard — Sprint 72 follow-up. Pipeline is expensive (AI cost)
  // and was previously callable by any authenticated client without
  // an explicit session check. requireUserAPI() reads the Supabase
  // session cookie; returns 401-shaped result on failure.
  const guard = await requireUserAPI();
  if (!guard.ok) {
    return {
      success: false,
      error: "Unauthorized: please sign in to run the pipeline.",
    };
  }
  try {
    const result = await runPipelineWithTracking();
    revalidatePath("/admin");
    revalidatePath("/admin/pipeline-runs");
    return {
      success: true,
      result: {
        startedAt: result.startedAt,
        finishedAt: result.finishedAt,
        durationMs: result.durationMs,
        rawPosts: result.rawPosts,
        painPoints: result.painPoints,
        clusters: result.clusters,
        opportunities: result.opportunities,
        ideas: result.ideas,
        success: result.success,
        errorMessage: result.errorMessage,
        runId: result.runId,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
    };
  }
}

export async function getLatestPipelineRunAction() {
  return getLatestExecution();
}

export async function getPipelineRunsAction(
  page = 1,
  limit = 20,
): Promise<{ runs: PipelineRunHistory[]; total: number; page: number; totalPages: number }> {
  const repo = await PipelineRunsRepository.create();
  const offset = (page - 1) * limit;
  const { runs, total } = await repo.list({ limit, offset });
  return {
    runs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
