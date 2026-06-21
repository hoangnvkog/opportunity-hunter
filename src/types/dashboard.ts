export interface DashboardStats {
  rawPosts: number;
  painPoints: number;
  embeddings: number;
  clusters: number;
  opportunities: number;
  ideas: number;
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
