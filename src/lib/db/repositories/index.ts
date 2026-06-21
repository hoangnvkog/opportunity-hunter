/**
 * Repositories barrel.
 */
export { SourcesRepository } from "./sources.repository";
export {
  RawPostsRepository,
  type ListRawPostsOptions,
} from "./raw-posts.repository";
export {
  PainPointsRepository,
  type ListPainPointsOptions,
} from "./pain-points.repository";
export { PainClustersRepository } from "./pain-clusters.repository";
export {
  OpportunitiesRepository,
  type ListOpportunitiesOptions,
  type OpportunityWithCluster,
  type OpportunityClusterNameOnly,
} from "./opportunities.repository";
export {
  StartupIdeasRepository,
  type ListStartupIdeasOptions,
} from "./startup-ideas.repository";
export { PipelineRunsRepository } from "./pipeline-runs.repository";
export { EmbeddingsRepository } from "./embeddings.repository";
