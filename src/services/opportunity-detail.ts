/**
 * Opportunity detail service — fetches a single opportunity with full
 * detail for the detail page.
 *
 * Architecture:
 *   app/opportunities/[id]/page.tsx (async server component)
 *     → actions/opportunities.actions.ts (server action)
 *       → services/opportunity-detail.ts (this file)
 *         → repositories/opportunities.repository.ts (DB access)
 *           → Supabase
 *
 * No component should access repositories directly.
 */

import { OpportunitiesRepository } from "@/lib/db/repositories";
import type { OpportunityDetail } from "@/types";

/**
 * Get a single opportunity by ID with full detail (cluster info + startup ideas count).
 *
 * @param id - Opportunity UUID.
 * @returns OpportunityDetail or null if not found.
 */
export async function getOpportunityDetailById(
  id: string,
): Promise<OpportunityDetail | null> {
  const repo = await OpportunitiesRepository.create();
  return repo.findDetailById(id);
}
