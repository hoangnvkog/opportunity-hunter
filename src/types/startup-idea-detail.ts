/**
 * Startup Idea Detail types
 * Used for displaying detailed information about a single startup idea
 */

export interface StartupIdeaDetail {
  id: string;
  problem: string;
  solution: string;
  mvp: string;
  pricing: string;
  customer: string | null;
  distribution: string | null;
  competitors: string | null;
  created_at: string;
  opportunity_score: number;
  cluster_name: string;
  cluster_description: string;
}
