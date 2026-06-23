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
  average_cluster_size: number | null;
  largest_cluster_size: number | null;
  status: string;
  error_message: string | null;
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
  average_cluster_size?: number | null;
  largest_cluster_size?: number | null;
  status: "success" | "failed" | "running";
  error_message?: string | null;
}
