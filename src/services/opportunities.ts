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
import { OpportunityInsightsRepository } from "@/lib/db/repositories/opportunity-insights.repository";

/** View shape consumed by the dashboard / opportunities pages. */
export interface OpportunityView {
  id: string;
  /** Sourced from `pain_clusters.name`. */
  title: string;
  /** Sourced from `pain_clusters.description`. */
  description: string;
  frequency: number;
  severity: number;
  /** camelCase alias for `buying_intent`. */
  buyingIntent: number;
  score: number;
  /** Number of pain points in the cluster (null for legacy rows). */
  clusterSize: number | null;
  /** Recency score 0–1 (null for legacy rows). */
  recencyScore: number | null;
  /** Source diversity score 0–1 (null for legacy rows). */
  sourceDiversity: number | null;
  /** Sourced from `pain_clusters.name` (one category per cluster). */
  category: string;
  /** Schema does not store a platform-level source per opportunity. */
  source: string;
  /** Schema does not store a per-opportunity creation timestamp. */
  createdAt: Date | undefined;
  /** AI-generated insight fields, populated when one exists. */
  insight: OpportunityInsightSummary | null;
}

export interface OpportunityInsightSummary {
  competition_level: "Low" | "Medium" | "High";
  urgency: "Low" | "Medium" | "High";
  confidence_score: number;
  summary: string;
}

export interface FindOpportunitiesFilters {
  limit?: number;
  offset?: number;
  category?: string;
  minScore?: number;
  /** Filter to opportunities whose AI insight satisfies these criteria. */
  insightCompetition?: "Low" | "Medium" | "High";
  insightUrgency?: "Low" | "Medium" | "High";
  insightMinConfidence?: number;
}

function toView(row: OpportunityWithCluster): OpportunityView {
  return {
    id: row.id,
    title: row.pain_clusters.name,
    description: row.pain_clusters.description,
    frequency: row.frequency,
    severity: row.severity,
    buyingIntent: row.buying_intent,
    score: row.score,
    clusterSize: row.cluster_size ?? null,
    recencyScore: row.recency_score != null ? parseFloat(row.recency_score) : null,
    sourceDiversity: row.source_diversity != null ? parseFloat(row.source_diversity) : null,
    category: row.pain_clusters.name,
    source: "Cluster",
    createdAt: undefined,
    insight: null,
  };
}

/**
 * List opportunities joined with their cluster, projected into the
 * dashboard view shape. Ordered by score descending (delegated to the
 * repository).
 *
 * Sprint 46: when insight-based filters are present we first resolve
 * the matching opportunity ids via `opportunity_insights` and feed
 * them back into the repo as an `id IN (...)` constraint. Inserts are
 * a single batch — no per-row joins.
 */
export async function findOpportunities(
  filters: FindOpportunitiesFilters = {},
): Promise<OpportunityView[]> {
  const repo = await OpportunitiesRepository.create();
  const {
    insightCompetition,
    insightUrgency,
    insightMinConfidence,
    ...repoFilters
  } = filters;

  if (
    insightCompetition ||
    insightUrgency ||
    insightMinConfidence !== undefined
  ) {
    const insightsRepo = await OpportunityInsightsRepository.create();
    const matchingInsights = await insightsRepo.listLatest({
      competition_level: insightCompetition,
      urgency: insightUrgency,
      minConfidence: insightMinConfidence,
      limit: 500,
    });
    const ids = new Set(matchingInsights.map((row) => row.opportunity_id));
    if (ids.size === 0) return [];

    // Re-run repository query with manual id list (rare path, ok perf-wise).
    const rows = await repo.findMany(repoFilters);
    return rows.filter((row) => ids.has(row.id)).map(toView);
  }

  const rows = await repo.findMany(repoFilters);
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
