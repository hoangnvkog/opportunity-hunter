/**
 * Pipeline Server Actions
 *
 * Server-side API for triggering pipeline execution and viewing run history.
 */
"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { PipelineRunsRepository } from "@/lib/db/repositories/pipeline-runs.repository";
import {
  createPipelineRunRecord,
  executePipelineRun,
  getLatestExecution,
} from "@/services/pipeline/orchestrator.service";
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
    const { runId, startedAt } = await createPipelineRunRecord();

    // Do not keep the Server Action request open for the full AI pipeline.
    // On Vercel Hobby, long Server Action responses can surface in the browser
    // as Next's generic "An unexpected response was received from the server".
    // `after()` lets Next/Vercel continue the work after a fast structured
    // response; the UI polls getLatestPipelineRunAction() for completion.
    after(async () => {
      await executePipelineRun(runId, startedAt);
      revalidatePath("/admin");
      revalidatePath("/admin/pipeline-runs");
      revalidatePath("/dashboard");
    });

    return {
      success: true,
      result: {
        startedAt,
        finishedAt: startedAt,
        durationMs: 0,
        rawPosts: 0,
        painPoints: 0,
        clusters: 0,
        opportunities: 0,
        ideas: 0,
        success: true,
        errorMessage: null,
        runId,
        status: "running",
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
