export interface DashboardStats {
  rawPosts: number;
  painPoints: number;
  embeddings: number;
  clusters: number;
  opportunities: number;
  /** Opportunities with a validation score. */
  validated: number;
  ideas: number;
  savedCount: number;
  watchlistsCount: number;
  unreadAlertsCount: number;
  averageClusterSize: number;
  largestClusterSize: number;
  /** Opportunities created in the last 7 days. */
  weeklyOpportunities: number;
  /** Total weekly digests marked as `sent` across all users. */
  weeklyEmailsSent: number;
  /** Total evidence records in the system (Sprint 53). */
  evidenceCount: number;
  /** Average confidence score across all evidence (0-100). */
  averageEvidenceConfidence: number;
  /** Opportunities that have at least one evidence record. */
  opportunitiesWithEvidence: number;
  /** Total forecast records in the system (Sprint 54). */
  forecastCount: number;
  /** Average forecast score across all forecasts (0-100). */
  averageForecastScore: number;
  /** Highest forecast score. */
  topForecastScore: number;
}

export interface OpportunityCardData {
  id: string;
  score: number;
  frequency: number;
  severity: number;
  buying_intent: number;
  source_diversity: number;
  recency_score: number;
  cluster_name: string;
  cluster_description: string;
}

export interface StartupIdeaCardData {
  id: string;
  problem: string;
  solution: string;
  mvp: string;
  pricing: string;
  score: number;
  cluster_name: string;
  cluster_description: string;
  created_at: string;
}
