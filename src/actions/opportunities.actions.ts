/**
 * Opportunities server actions
 * Next.js server actions for opportunities data
 */

"use server";

import { findOpportunities, getOpportunityById } from "@/services/opportunities";
import type { FindOpportunitiesFilters } from "@/services/opportunities";

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
  return await getOpportunityById(id);
}
