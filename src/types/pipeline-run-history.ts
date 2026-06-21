/**
 * Pipeline run history types
 */

export interface PipelineRunHistory {
  id: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  sources: number;
  raw_posts: number;
  pain_points: number;
  embeddings: number;
  clusters: number;
  opportunities: number;
  startup_ideas: number;
  status: string;
}

export interface PipelineRunInsert {
  started_at: string;
  finished_at: string;
  duration_ms: number;
  sources: number;
  raw_posts: number;
  pain_points: number;
  embeddings: number;
  clusters: number;
  opportunities: number;
  startup_ideas: number;
  status: "success" | "failed";
}
