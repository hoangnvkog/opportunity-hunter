/**
 * Pipeline run result type for manual execution
 */

export interface PipelineRunResult {
  sources: number;
  rawPosts: number;
  painPoints: number;
  embeddings: number;
  clusters: number;
  opportunities: number;
  validated: number;
  startupIdeas: number;
  averageClusterSize: number;
  largestClusterSize: number;
  durationMs: number;
}

/**
 * Detailed stats per pipeline stage (used by run-full-pipeline service)
 */
export interface PipelineStageStats {
  processed: number;
  extracted?: number;
  generated?: number;
  clustered?: number;
  skipped: number;
  inserted: number;
}

export interface PipelineRunStats {
  postsFetched: number;
  painPoints: PipelineStageStats;
  clusters: PipelineStageStats;
  opportunities: PipelineStageStats;
  ideas: PipelineStageStats;
  durationMs: number;
}

/**
 * API response shape for /api/pipeline/run
 */
export interface PipelineRunResponse {
  success: boolean;
  stats?: PipelineRunStats;
  message?: string;
}
