/**
 * Dashboard server actions
 * Next.js server actions for dashboard data
 */

"use server";

import {
  getDashboardMetrics,
  getRecentOpportunities,
  getCategoryTrends,
  getOpportunitiesWithFilters,
} from "@/services/dashboard";
import type { DashboardFilters } from "@/services/dashboard";

/**
 * Refresh dashboard data
 * Server action wrapper for dashboard services
 * 
 * @returns Dashboard metrics, recent opportunities, and category trends
 */
export async function getDashboardDataAction() {
  const [metrics, recentOpportunities, categoryTrends] = await Promise.all([
    getDashboardMetrics(),
    getRecentOpportunities(),
    getCategoryTrends(),
  ]);

  return {
    metrics,
    recentOpportunities,
    categoryTrends,
  };
}

/**
 * Get opportunities with filters
 * Server action wrapper for getOpportunitiesWithFilters()
 * 
 * @param filters - Dashboard filters (q, category, minScore, etc.)
 * @returns Filtered opportunities
 */
export async function getOpportunitiesWithFiltersAction(
  filters: DashboardFilters
) {
  return getOpportunitiesWithFilters(filters);
}
