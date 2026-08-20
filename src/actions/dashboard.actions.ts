"use server";

import type { OpportunityFilters, StartupIdeaFilters } from "@/types/filters";
import type { OpportunityCardData, StartupIdeaCardData } from "@/types/dashboard";
import {
  getFilteredOpportunities,
  getFilteredStartupIdeas,
} from "@/services/dashboard/dashboard.service";
import { requireUserAction } from "@/lib/auth/api-guard";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getFilteredOpportunitiesAction(
  filters: OpportunityFilters
): Promise<ActionResponse<OpportunityCardData[]>> {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getFilteredOpportunities(filters);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch filtered opportunities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getFilteredStartupIdeasAction(
  filters: StartupIdeaFilters
): Promise<ActionResponse<StartupIdeaCardData[]>> {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getFilteredStartupIdeas(filters);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch filtered startup ideas:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
