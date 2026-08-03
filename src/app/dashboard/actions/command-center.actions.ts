/**
 * Server actions for the dashboard command center panels.
 * Each panel fetch is isolated so the page can fan them out in parallel.
 */
"use server";

import {
  getTopOpportunities,
  getLatestPipelineRuns,
} from "@/services/dashboard/dashboard.service";
import { getCategoryTrends } from "@/services/dashboard";
import type { OpportunityCardData } from "@/types/dashboard";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getDashboardTopOpportunitiesAction(
  limit = 5,
): Promise<ActionResponse<OpportunityCardData[]>> {
  try {
    const data = await getTopOpportunities(limit);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getDashboardLatestPipelineRunAction(): Promise<
  ActionResponse<PipelineRunHistory | null>
> {
  try {
    const runs = await getLatestPipelineRuns(1);
    return { success: true, data: runs[0] ?? null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getDashboardCategoryTrendsAction(
  limit = 6,
): Promise<ActionResponse<Array<{ category: string; count: number }>>> {
  try {
    const data = await getCategoryTrends(limit);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
