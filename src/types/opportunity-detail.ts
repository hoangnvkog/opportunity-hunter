/**
 * Opportunity detail view type.
 *
 * Combines the opportunity row, its parent pain cluster, and an
 * aggregate count of startup ideas. Used by the opportunity detail
 * page (`/opportunities/[id]`).
 *
 * Note: the `opportunities` table does not have a `created_at` column
 * per the schema (docs/DATABASE_DESIGN.md). The field is kept optional
 * so the UI can render a fallback when it is unavailable.
 */

export interface OpportunityDetail {
  id: string;

  /** Derived score in [0, 100]. */
  score: number;

  /** How many pain points map to the underlying cluster. */
  frequency: number;

  /** Average severity in [0, 1]. */
  severity: number;

  /** Average buying intent in [0, 1]. */
  buying_intent: number;

  /** Cluster name (from `pain_clusters.name`). */
  cluster_name: string;

  /** Cluster description (from `pain_clusters.description`). */
  cluster_description: string;

  /**
   * Not stored on the `opportunities` or `pain_clusters` tables.
   * Present for forward-compatibility; will be `undefined` until a
   * migration adds the column.
   */
  created_at?: string;

  /** Number of startup ideas linked to this opportunity. */
  startup_ideas_count: number;
}
