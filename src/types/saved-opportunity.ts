import type { Uuid } from "./database.types";

/**
 * Row type for saved_opportunities table
 */
export type SavedOpportunityRow = {
  id: Uuid;
  user_id: Uuid;
  opportunity_id: Uuid;
  created_at: string;
};

/**
 * Insert type for creating saved opportunities
 */
export type SavedOpportunityInsert = {
  user_id: Uuid;
  opportunity_id: Uuid;
};

/**
 * Card data for displaying saved opportunities in UI
 * Includes opportunity details and cluster info
 */
export type SavedOpportunityCardData = {
  id: Uuid;
  opportunity_id: Uuid;
  title: string;
  description: string;
  score: number;
  frequency: number;
  severity: number;
  buying_intent: number;
  cluster_name: string;
  cluster_description: string;
  saved_at: string;
};
