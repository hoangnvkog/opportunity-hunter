/**
 * Pipeline run statistics and response types
 */

export interface StageStats {
  processed: number;
  extracted?: number;
  clustered?: number;
  generated?: number;
  skipped: number;
  inserted: number;
}

export interface PipelineRunStats {
  postsFetched: number;
  painPoints: StageStats;
  clusters: StageStats;
  opportunities: StageStats;
  ideas: StageStats;
  durationMs: number;
}

export interface PipelineRunResponse {
  success: boolean;
  stats?: PipelineRunStats;
  message?: string;
}
