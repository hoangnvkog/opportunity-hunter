/**
 * Pipeline types for AI-powered data extraction and generation.
 * These interfaces define the data flow from raw posts to startup ideas.
 * 
 * NOTE: These are transient DTOs used between pipeline stages.
 * They do NOT map directly to database columns.
 */

/** Raw post input from external sources (Reddit, Twitter, etc.) */
export interface RawPostInput {
  source: string;
  title: string;
  content: string;
  url: string;
  score?: number;
  created_at: string;
}

/** Pain point extracted from a raw post */
export interface PainPointInput {
  pain: string;
  category: string;
  severity: number;
  buying_intent: number;
}

/** Cluster of similar pain points */
export interface PainClusterInput {
  cluster_name: string;
  description: string;
}

/** Business opportunity derived from a pain cluster */
export interface OpportunityInput {
  cluster_id: string;
  title: string;
  description: string;
  score: number;
  frequency: number;
  severity: number;
  buying_intent: number;
}

/** Startup idea generated from an opportunity */
export interface StartupIdeaInput {
  opportunity_id: string;
  problem: string;
  solution: string;
  mvp: string;
  pricing: string;
  customer: string;
  distribution: string;
  competitors: string;
}
