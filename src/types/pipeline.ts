/**
 * Pipeline types for AI-powered data extraction and generation.
 *
 * IMPORTANT:
 * - These are AI DOMAIN models only. Pure business data.
 * - NO database UUIDs. NO foreign keys.
 * - NO id, raw_post_id, cluster_id, opportunity_id fields.
 * - AI providers return these. Services map to real DB rows.
 *
 * Database is the only component that generates UUIDs.
 */

export interface RawPostInput {
  source: string;
  title: string;
  content: string;
  url: string;
  score?: number;
  created_at: string;
}

/** Pain point from AI - no IDs */
export interface PainPointInput {
  pain: string;
  category: string;
  severity: number;
  buying_intent: number;
}

/** Cluster from AI - no IDs, includes pain point indexes for linkage */
export interface PainClusterInput {
  cluster_name: string;
  description: string;
  pain_point_indexes: number[];
}

/** Opportunity from AI - no IDs, has optional cluster context for title/description */
export interface OpportunityInput {
  /** Optional database ID — populated when loaded from DB, null when from AI. */
  id?: string;
  score: number;
  frequency: number;
  severity: number;
  buying_intent: number;
  cluster_size?: number;
  recency_score?: number;
  source_diversity?: number;
  cluster_name?: string;
  cluster_description?: string;
}

/** Startup idea from AI - no IDs */
export interface StartupIdeaInput {
  problem: string;
  solution: string;
  mvp: string;
  pricing: string;
  customer: string;
  distribution: string;
  competitors: string;
}