/**
 * Sprint 63: AI Venture Studio Generator
 *
 * Types for venture_projects, venture_canvas, venture_gtm, venture_mvp tables.
 * AI returns business data only — no UUIDs, no foreign keys.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only — no UUIDs, no FKs)
// ---------------------------------------------------------------------------

export interface VentureCanvasInput {
  problem: string;
  solution: string;
  value_proposition: string;
  customer_segments: string;
  channels: string;
  customer_relationships: string;
  key_activities: string;
  key_resources: string;
  key_partners: string;
  cost_structure: string;
  revenue_streams: string;
}

export interface VentureGtmInput {
  launch_strategy: string;
  acquisition_channels: string;
  pricing_strategy: string;
  growth_loops: string;
  marketing_plan: string;
  sales_plan: string;
}

export interface VentureMvpInput {
  core_features: string;
  roadmap: string;
  tech_stack: string;
  estimated_cost: string;
  estimated_time: string;
  risks: string;
}

export interface VentureProjectInput {
  name: string;
  tagline: string;
  overall_score: number;
  canvas: VentureCanvasInput;
  gtm: VentureGtmInput;
  mvp: VentureMvpInput;
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type VentureProjectRow = {
  id: Uuid;
  opportunity_id: Uuid;
  startup_idea_id: Uuid | null;
  name: string;
  tagline: string;
  status: string;
  overall_score: number;
  created_at: string;
  updated_at: string;
};

export type VentureProjectInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  startup_idea_id?: Uuid | null;
  name: string;
  tagline: string;
  status?: string;
  overall_score?: number;
  created_at?: string;
  updated_at?: string;
};

export type VentureCanvasRow = {
  id: Uuid;
  venture_project_id: Uuid;
  problem: string;
  solution: string;
  value_proposition: string;
  customer_segments: string;
  channels: string;
  customer_relationships: string;
  key_activities: string;
  key_resources: string;
  key_partners: string;
  cost_structure: string;
  revenue_streams: string;
  created_at: string;
};

export type VentureCanvasInsert = {
  id?: Uuid;
  venture_project_id: Uuid;
  problem: string;
  solution: string;
  value_proposition: string;
  customer_segments: string;
  channels: string;
  customer_relationships: string;
  key_activities: string;
  key_resources: string;
  key_partners: string;
  cost_structure: string;
  revenue_streams: string;
  created_at?: string;
};

export type VentureGtmRow = {
  id: Uuid;
  venture_project_id: Uuid;
  launch_strategy: string;
  acquisition_channels: string;
  pricing_strategy: string;
  growth_loops: string;
  marketing_plan: string;
  sales_plan: string;
  created_at: string;
};

export type VentureGtmInsert = {
  id?: Uuid;
  venture_project_id: Uuid;
  launch_strategy: string;
  acquisition_channels: string;
  pricing_strategy: string;
  growth_loops: string;
  marketing_plan: string;
  sales_plan: string;
  created_at?: string;
};

export type VentureMvpRow = {
  id: Uuid;
  venture_project_id: Uuid;
  core_features: string;
  roadmap: string;
  tech_stack: string;
  estimated_cost: string;
  estimated_time: string;
  risks: string;
  created_at: string;
};

export type VentureMvpInsert = {
  id?: Uuid;
  venture_project_id: Uuid;
  core_features: string;
  roadmap: string;
  tech_stack: string;
  estimated_cost: string;
  estimated_time: string;
  risks: string;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface VentureProjectCardData {
  id: Uuid;
  opportunity_id: Uuid;
  startup_idea_id: Uuid | null;
  name: string;
  tagline: string;
  status: string;
  overall_score: number;
  created_at: string;
}

export interface VentureProjectDetail {
  project: VentureProjectRow;
  canvas: VentureCanvasRow | null;
  gtm: VentureGtmRow | null;
  mvp: VentureMvpRow | null;
}

export interface VentureStudioStats {
  total: number;
  readyToBuild: number;
  averageScore: number;
  averageMvpCost: string;
}

export interface VentureStudioGenerationResult {
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}
