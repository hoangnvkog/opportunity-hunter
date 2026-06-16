/**
 * Dashboard server actions
 * Next.js server actions for dashboard data
 */

"use server";

import {
  getDashboardMetrics,
  getRecentOpportunities,
  getCategoryTrends,
} from "@/services/dashboard";

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
