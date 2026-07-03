/**
 * Sprint 62: Autonomous Research Agent
 *
 * Types for research_jobs, research_sources, research_logs tables.
 */

import type { Uuid, RawPostRow } from "./index";

// ---------------------------------------------------------------------------
// Enums (as const for type safety)
// ---------------------------------------------------------------------------

export const ResearchJobStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type ResearchJobStatus = typeof ResearchJobStatus[keyof typeof ResearchJobStatus];

export const ResearchSourceStatus = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
} as const;

export type ResearchSourceStatus = typeof ResearchSourceStatus[keyof typeof ResearchSourceStatus];

export const ResearchLogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

export type ResearchLogLevel = typeof ResearchLogLevel[keyof typeof ResearchLogLevel];

export const ResearchSourceName = {
  REDDIT: 'reddit',
  GITHUB: 'github',
  HACKERNEWS: 'hackernews',
  PRODUCTHUNT: 'producthunt',
  RSS: 'rss',
} as const;

export type ResearchSourceName = typeof ResearchSourceName[keyof typeof ResearchSourceName];

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export type ResearchJobRow = {
  id: Uuid;
  source: ResearchSourceName; // or 'all' for multiple sources
  status: ResearchJobStatus;
  started_at: string | null;
  finished_at: string | null;
  items_found: number;
  items_processed: number;
  created_at: string;
};

export type ResearchJobInsert = {
  id?: Uuid;
  source: ResearchSourceName;
  status?: ResearchJobStatus;
  started_at?: string | null;
  finished_at?: string | null;
  items_found?: number;
  items_processed?: number;
  created_at?: string;
};

export type ResearchSourceRow = {
  id: Uuid;
  name: ResearchSourceName;
  enabled: boolean;
  priority: number; // 0-100
  rate_limit: number; // requests per minute
  last_sync: string | null;
  created_at: string;
};

export type ResearchSourceInsert = {
  id?: Uuid;
  name: ResearchSourceName;
  enabled?: boolean;
  priority?: number;
  rate_limit?: number;
  last_sync?: string | null;
  created_at?: string;
};

export type ResearchLogRow = {
  id: Uuid;
  job_id: Uuid;
  stage: string;
  message: string;
  level: ResearchLogLevel;
  created_at: string;
};

export type ResearchLogInsert = {
  id?: Uuid;
  job_id: Uuid;
  stage: string;
  message: string;
  level?: ResearchLogLevel;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface ResearchJobCardData {
  id: Uuid;
  source: ResearchSourceName;
  status: ResearchJobStatus;
  started_at: string | null;
  finished_at: string | null;
  items_found: number;
  items_processed: number;
  duration_ms: number | null;
  created_at: string;
}

export interface ResearchJobWithLogs {
  job: ResearchJobRow;
  logs: ResearchLogRow[];
}

export interface ResearchStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  successRate: number;
  averageDurationMs: number;
  totalItemsFound: number;
  totalItemsProcessed: number;
}

// ---------------------------------------------------------------------------
// Research Source Adapter Interface
// ---------------------------------------------------------------------------

export interface ResearchSourceAdapter {
  name: ResearchSourceName;
  collect(): Promise<RawPostRow[]>;
  health(): Promise<boolean>;
  rateLimit(): number; // requests per minute
}

// ---------------------------------------------------------------------------
// Source-specific data types
// ---------------------------------------------------------------------------

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  url: string;
  score: number;
  created_utc: number;
}

export interface GithubIssue {
  id: number;
  title: string;
  body: string | null;
  html_url: string;
  created_at: string;
  reactions: {
    total_count: number;
  };
}

export interface HackerNewsItem {
  id: number;
  title: string;
  url: string | null;
  text: string | null;
  score: number;
  time: number;
  by: string;
  descendants: number;
}

export interface ProductHuntPost {
  id: number;
  name: string;
  tagline: string;
  url: string;
  votes_count: number;
  created_at: string;
}

export interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
}