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
import { findOpportunities } from "@/services/opportunities";
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
 * Extended filters for dashboard queries.
 */
export interface DashboardFilters {
  q?: string;
  minScore?: number;
  minSeverity?: number;
  minBuyingIntent?: number;
  sort?: 'score_desc' | 'score_asc' | 'buying_intent_desc' | 'newest';
  page?: number;
  pageSize?: number;
}

/**
 * Paginated result shape.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get dashboard metrics from the database.
 *
 * @returns Aggregated metrics for the dashboard header cards.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const repo = await OpportunitiesRepository.create();

  // Fetch all opportunities with cluster data (use findMany for consistency)
  const allOpportunities = await repo.findMany({ limit: 1000 });

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

  // Get top category by count (Sprint 68: read live cluster names from
  // the database rather than a hard-coded label set that always
  // returned `count: 0`).
  const categoryTrends = await getCategoryTrends(6);
  const topCategory =
    categoryTrends.length > 0 ? categoryTrends[0].category : "None";

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
 * Get opportunities with search, filter, sort, and pagination.
 *
 * @param filters - Search, filter, sort, and pagination parameters.
 * @returns Paginated opportunities matching the criteria.
 */
export async function getOpportunitiesWithFilters(
  filters: DashboardFilters = {}
): Promise<PaginatedResult<OpportunityView>> {
  const {
    q,
    minScore,
    minSeverity,
    minBuyingIntent,
    sort = 'score_desc',
    page = 1,
    pageSize = 10,
  } = filters;

  const repo = await OpportunitiesRepository.create();
  
  // Fetch all opportunities with cluster data
  let allOpportunities = await repo.listTopWithCluster(1000);

  // Apply search filter (server-side)
  if (q && q.trim()) {
    const searchTerm = q.toLowerCase().trim();
    allOpportunities = allOpportunities.filter(opp => 
      opp.pain_clusters.name.toLowerCase().includes(searchTerm) ||
      opp.pain_clusters.description.toLowerCase().includes(searchTerm)
    );
  }

  // Apply score filter
  if (minScore !== undefined) {
    allOpportunities = allOpportunities.filter(opp => opp.score >= minScore);
  }

  // Apply severity filter
  if (minSeverity !== undefined) {
    allOpportunities = allOpportunities.filter(opp => opp.severity >= minSeverity);
  }

  // Apply buying intent filter
  if (minBuyingIntent !== undefined) {
    allOpportunities = allOpportunities.filter(opp => opp.buying_intent >= minBuyingIntent);
  }

  // Apply sorting
  switch (sort) {
    case 'score_asc':
      allOpportunities.sort((a, b) => a.score - b.score);
      break;
    case 'buying_intent_desc':
      allOpportunities.sort((a, b) => b.buying_intent - a.buying_intent);
      break;
    case 'newest':
      // No created_at column, so just keep original order (score desc)
      break;
    case 'score_desc':
    default:
      allOpportunities.sort((a, b) => b.score - a.score);
      break;
  }

  // Calculate pagination
  const total = allOpportunities.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  const paginatedData = allOpportunities.slice(offset, offset + pageSize);

  // Convert to OpportunityView
  const data = paginatedData.map(row => ({
    id: row.id,
    title: row.pain_clusters.name,
    description: row.pain_clusters.description,
    frequency: row.frequency,
    severity: row.severity,
    buyingIntent: row.buying_intent,
    score: row.score,
    clusterSize: row.cluster_size ?? 0,
    recencyScore: parseFloat(row.recency_score ?? "0"),
    sourceDiversity: parseFloat(row.source_diversity ?? "0"),
    category: row.pain_clusters.name,
    source: "Cluster",
    createdAt: undefined,
    insight: null,
  }));

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get category trends for the dashboard chart.
 *
 * Reads the *actual* top-N cluster names from the `opportunities` →
 * `pain_clusters` join, ordered by opportunity count descending.
 * Replaces the previous implementation that hard-coded a 6-element
 * category list which always returned `count: 0` for AI-generated
 * cluster names ("Regulatory Compliance & Platform Governance", etc.).
 *
 * @returns Array of {category, count} objects, length 0..limit.
 */
export async function getCategoryTrends(
  limit = 6,
): Promise<Array<{ category: string; count: number }>> {
  const { OpportunitiesRepository } = await import(
    "@/lib/db/repositories/opportunities.repository"
  );
  const repo = await OpportunitiesRepository.create();
  return repo.topClusterNamesByOpportunityCount(limit);
}
