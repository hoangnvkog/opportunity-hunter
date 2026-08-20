"use server";

import { getLatestPipelineRuns } from "@/services/dashboard/dashboard.service";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";
import { requireUserAction } from "@/lib/auth/api-guard";

export async function getPipelineRunsAction(
  limit = 10
): Promise<PipelineRunHistory[]> {
  const auth = await requireUserAction();
  if (!auth.ok) return [];
  try {
    return await getLatestPipelineRuns(limit);
  } catch (error) {
    console.error("Failed to fetch pipeline runs:", error);
    return [];
  }
}
