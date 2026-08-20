/**
 * Opportunities server actions
 * Next.js server actions for opportunities data
 */

"use server";

import { findOpportunities, getOpportunityById } from "@/services/opportunities";
import { getOpportunityDetailById } from "@/services/opportunity-detail";
import type { FindOpportunitiesFilters } from "@/services/opportunities";
import type { OpportunityDetail } from "@/types";
import { requireUserAction } from "@/lib/auth/api-guard";

/**
 * Find opportunities with optional filters
 * Server action wrapper for findOpportunities()
 *
 * @param filters - Optional filters for limit, offset, category, minScore
 * @returns Array of opportunity views
 */
export async function findOpportunitiesAction(
  filters?: FindOpportunitiesFilters
) {
  const auth = await requireUserAction();
  if (!auth.ok) return [];
  return await findOpportunities(filters);
}

/**
 * Find a single opportunity by ID
 * Server action wrapper for getOpportunityById()
 *
 * @param id - Opportunity ID
 * @returns Opportunity view or throws error if not found
 */
export async function findOpportunityByIdAction(id: string) {
  const auth = await requireUserAction();
  if (!auth.ok) return null;
  return await getOpportunityById(id);
}

/**
 * Get full opportunity detail by ID.
 * Returns the OpportunityDetail shape or null if not found.
 *
 * @param id - Opportunity UUID.
 * @returns Typed detail object or null.
 */
export async function getOpportunityDetailAction(
  id: string,
): Promise<OpportunityDetail | null> {
  const auth = await requireUserAction();
  if (!auth.ok) return null;
  try {
    return await getOpportunityDetailById(id);
  } catch (error) {
    console.error("[getOpportunityDetailAction] Failed:", error);
    return null;
  }
}
