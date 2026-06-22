"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/server";
import { OpportunityInsightService } from "@/services/insights/opportunity-insight.service";
import type {
  OpportunityInsightCardData,
  OpportunityInsightFilters,
} from "@/types/opportunity-insight";

/**
 * Return the latest N insights for the dashboard widget.
 * No-op when the user is signed out (returns []).
 */
export async function listRecentInsightsAction(
  limit = 5,
): Promise<OpportunityInsightCardData[]> {
  await getUser(); // auth gate (no per-user filter on insights yet)
  const service = await OpportunityInsightService.create();
  return service.listRecentInsights(limit);
}

/**
 * Find the single insight for one opportunity.
 * Returns null when none has been generated yet.
 */
export async function findInsightByOpportunityIdAction(
  opportunityId: string,
): Promise<OpportunityInsightCardData | null> {
  const service = await OpportunityInsightService.create();
  return service.findInsight(opportunityId);
}

/**
 * List insights for the `/insights` history page. Supports filters
 * declared by OpportunityInsightFilters (competition_level, urgency,
 * minConfidence, sort, order, limit, offset).
 */
export async function listInsightsAction(
  filters: OpportunityInsightFilters = {},
): Promise<{
  items: OpportunityInsightCardData[];
  total: number;
}> {
  const service = await OpportunityInsightService.create();
  return service.listInsights(filters);
}

/**
 * Manually trigger AI insight generation. Limited to `limit` per call.
 * Used by /insights "Generate now" button or pipeline-step admin tools.
 */
export async function generateInsightsFromDatabaseAction(
  limit = 20,
): Promise<{
  scanned: number;
  created: number;
}> {
  await getUser(); // admin UI is dashboard-only — gate via auth
  const service = await OpportunityInsightService.create();
  const result = await service.generateInsightsFromDatabase(limit);

  revalidatePath("/insights");
  revalidatePath("/dashboard");
  revalidatePath(`/opportunities`);
  return result;
}
