import type { Uuid } from "./database.types";

/**
 * Row type for watchlists table
 */
export type WatchlistRow = {
  id: Uuid;
  user_id: Uuid;
  name: string;
  search: string | null;
  min_score: number | null;
  min_frequency: number | null;
  min_severity: number | null;
  min_buying_intent: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * Insert type for creating watchlists
 */
export type WatchlistInsert = {
  name: string;
  search?: string | null;
  min_score?: number | null;
  min_frequency?: number | null;
  min_severity?: number | null;
  min_buying_intent?: number | null;
};

/**
 * Update type for updating watchlists
 */
export type WatchlistUpdate = {
  name?: string;
  search?: string | null;
  min_score?: number | null;
  min_frequency?: number | null;
  min_severity?: number | null;
  min_buying_intent?: number | null;
};

/**
 * Card data for displaying watchlists in UI
 */
export type WatchlistCardData = {
  id: Uuid;
  name: string;
  search: string | null;
  min_score: number | null;
  min_frequency: number | null;
  min_severity: number | null;
  min_buying_intent: number | null;
  created_at: string;
  alert_count: number;
};

/**
 * Row type for alerts table
 */
export type AlertRow = {
  id: Uuid;
  user_id: Uuid;
  watchlist_id: Uuid;
  opportunity_id: Uuid;
  is_read: boolean;
  created_at: string;
};

/**
 * Card data for displaying alerts in UI
 */
export type AlertCardData = {
  id: Uuid;
  watchlist_id: Uuid;
  watchlist_name: string;
  opportunity_id: Uuid;
  opportunity_title: string;
  cluster_name: string;
  score: number;
  is_read: boolean;
  created_at: string;
};
