/**
 * Pipeline types for AI-powered data extraction and generation.
 * These interfaces define the data flow from raw posts to startup ideas.
 */

/** Raw post input from external sources (Reddit, Twitter, etc.) */
export interface RawPostInput {
  id: string;
  source: string;
  title: string;
  content: string;
  url: string;
  score?: number;
  created_at: string;
}

/** Pain point extracted from a raw post */
export interface PainPointInput {
  id: string;
  raw_post_id: string;
  pain: string;
  category: string;
  severity: number;
  buying_intent: number;
}

/** Cluster of similar pain points */
export interface PainClusterInput {
  id: string;
  cluster_name: string;
  description: string;
  pain_point_ids: string[];
}

/** Business opportunity derived from a pain cluster */
export interface OpportunityInput {
  id: string;
  cluster_id: string;
  score: number;
  frequency: number;
  severity: number;
  buying_intent: number;
}

/** Startup idea generated from an opportunity */
export interface StartupIdeaInput {
  id: string;
  opportunity_id: string;
  name: string;
  description: string;
  target_market: string;
  monetization: string;
}
