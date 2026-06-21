"use server";

import { getLatestPipelineRuns } from "@/services/dashboard/dashboard.service";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";

export async function getPipelineRunsAction(
  limit = 10
): Promise<PipelineRunHistory[]> {
  try {
    return await getLatestPipelineRuns(limit);
  } catch (error) {
    console.error("Failed to fetch pipeline runs:", error);
    throw error;
  }
}
