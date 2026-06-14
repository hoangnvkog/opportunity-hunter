/**
 * Opportunities service — read-only adapter from the database to the
 * dashboard view shape.
 *
 * Why this exists:
 *   The repository layer returns raw `OpportunityRow` (id, cluster_id,
 *   score, frequency, severity, buying_intent). The UI was originally
 *   built against mock data that carries `title`, `description`,
 *   `category`, `source`, `createdAt`. The database schema intentionally
 *   keeps opportunities lean — those human-facing fields live on the
 *   joined `pain_clusters` row (`cluster_name`, `description`).
 *
 *   This service:
 *     1. Fetches opportunities joined with their cluster.
 *     2. Projects the joined rows to the `OpportunityView` shape the
 *        UI consumes.
 *     3. Aggregates category counts for `CategoryTrends`.
 *
 *   The mock `Opportunity` interface is preserved (now `OpportunityView`)
 *   so existing components compile against the same shape until they
 *   are migrated off it.
 *
 * What this service intentionally does NOT do:
 *   - Synthesize fields the schema does not store. `source` and
 *     `createdAt` are not on `opportunities` or `pain_clusters`, so
 *     the view fills them with safe defaults (`"Cluster"`,
 *     `undefined` → rendered as "N/A" at the edge).
 *   - Replace the repositories. All DB IO still flows through them.
 *
 * Source of truth: docs/DATABASE_DESIGN.md
 */

import {
  OpportunitiesRepository,
  type OpportunityWithCluster,
} from "@/lib/db/repositories";

/** View shape consumed by the dashboard / opportunities pages. */
export interface OpportunityView {
  id: string;
  /** Sourced from `pain_clusters.cluster_name`. */
  title: string;
  /** Sourced from `pain_clusters.description`. */
  description: string;
  frequency: number;
  severity: number;
  /** camelCase alias for `buying_intent`. */
  buyingIntent: number;
  score: number;
  /** Sourced from `pain_clusters.cluster_name` (one category per cluster). */
  category: string;
  /** Schema does not store a platform-level source per opportunity. */
  source: string;
  /** Schema does not store a per-opportunity creation timestamp. */
  createdAt: Date | undefined;
}

export interface FindOpportunitiesFilters {
  limit?: number;
  offset?: number;
  category?: string;
  minScore?: number;
}

function toView(row: OpportunityWithCluster): OpportunityView {
  return {
    id: row.id,
    title: row.pain_clusters.cluster_name,
    description: row.pain_clusters.description,
    frequency: row.frequency,
    severity: row.severity,
    buyingIntent: row.buying_intent,
    score: row.score,
    category: row.pain_clusters.cluster_name,
    source: "Cluster",
    createdAt: undefined,
  };
}

/**
 * List opportunities joined with their cluster, projected into the
 * dashboard view shape. Ordered by score descending (delegated to the
 * repository).
 */
export async function findOpportunities(
  filters: FindOpportunitiesFilters = {},
): Promise<OpportunityView[]> {
  const repo = await OpportunitiesRepository.create();
  const rows = await repo.findMany(filters);
  return rows.map(toView);
}

/**
 * Look up a single opportunity by id, projected into the view shape.
 * Throws Error if the row does not exist.
 */
export async function getOpportunityById(
  id: string,
): Promise<OpportunityView> {
  const repo = await OpportunitiesRepository.create();
  const row = await repo.findByIdWithCluster(id);
  if (!row) {
    throw new Error("Opportunity not found");
  }
  return toView(row);
}

/**
 * Aggregate category counts from the live `opportunities` table, joined
 * to `pain_clusters`. Replaces `getCategoryCount(category)` from the
 * mock layer which used hard-coded base counts plus `Math.random()`.
 *
 * The returned set is restricted to the supplied category names — pass
 * a known set to pin ordering for chart rendering.
 */
export async function getCategoryCounts(
  categories: readonly string[],
): Promise<Array<{ category: string; count: number }>> {
  if (categories.length === 0) return [];
  const repo = await OpportunitiesRepository.create();
  const counts = await repo.countByClusterName(categories);
  return categories.map((c) => ({
    category: c,
    count: counts.get(c) ?? 0,
  }));
}
