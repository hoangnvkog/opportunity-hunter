/**
 * Dashboard API route
 * GET /api/dashboard
 * Returns metrics, recent opportunities, and category trends
 */

import { NextResponse } from "next/server";
import {
  getDashboardMetrics,
  getRecentOpportunities,
  getCategoryTrends,
} from "@/services/dashboard";

export async function GET() {
  try {
    const [metrics, recentOpportunities, categoryTrends] = await Promise.all([
      getDashboardMetrics(),
      getRecentOpportunities(),
      getCategoryTrends(),
    ]);

    return NextResponse.json({
      metrics,
      recentOpportunities,
      categoryTrends,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
