/**
 * Dashboard service — aggregates data from multiple repositories
 * for the dashboard view.
 *
 * Architecture:
 *   app/dashboard/page.tsx (async, load data)
 *     → services/dashboard.ts (aggregate)
 *       → repositories/* (DB access)
 *         → Supabase
 *
 * No component should access repositories directly.
 */

import { OpportunitiesRepository } from "@/lib/db/repositories";
import { findOpportunities, getCategoryCounts } from "@/services/opportunities";
import type { OpportunityView } from "@/services/opportunities";

/**
 * Dashboard metrics shape.
 */
export interface DashboardMetrics {
  /** Total number of opportunities in the database. */
  totalOpportunities: number;
  /** Average score across all opportunities. */
  averageScore: number;
  /** Number of validated opportunities (score >= 70). */
  validatedCount: number;
  /** Category with the most opportunities. */
  topCategory: string;
}

/**
 * Get dashboard metrics from the database.
 *
 * @returns Aggregated metrics for the dashboard header cards.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const repo = await OpportunitiesRepository.create();

  // Fetch all opportunities with cluster data
  const allOpportunities = await repo.listTopWithCluster(1000);

  // Calculate metrics
  const totalOpportunities = allOpportunities.length;
  const averageScore =
    totalOpportunities > 0
      ? Math.round(
          allOpportunities.reduce((sum, opp) => sum + opp.score, 0) /
            totalOpportunities
        )
      : 0;
  const validatedCount = allOpportunities.filter(
    (opp) => opp.score >= 70
  ).length;

  // Get top category by count
  const categories = [
    "Customer Service",
    "Productivity",
    "Marketing",
    "E-commerce",
    "Finance",
    "Healthcare",
  ];
  const counts = await getCategoryCounts(categories);
  const topCategory =
    counts.length > 0
      ? counts.reduce((max, curr) => (curr.count > max.count ? curr : max))
          .category
      : "None";

  return {
    totalOpportunities,
    averageScore,
    validatedCount,
    topCategory,
  };
}

/**
 * Get recent opportunities for the dashboard.
 *
 * @param limit - Maximum number of opportunities to return (default: 5).
 * @returns Array of OpportunityView, ordered by score descending.
 */
export async function getRecentOpportunities(
  limit = 5
): Promise<OpportunityView[]> {
  return findOpportunities({ limit });
}

/**
 * Get category trends for the dashboard chart.
 *
 * @returns Array of {category, count} objects.
 */
export async function getCategoryTrends(): Promise<
  Array<{ category: string; count: number }>
> {
  const categories = [
    "Customer Service",
    "Productivity",
    "Marketing",
    "E-commerce",
    "Finance",
    "Healthcare",
  ];
  return getCategoryCounts(categories);
}
