/**
 * Dashboard service — aggregates data from multiple repositories
 * for the dashboard view.
 *
 * Architecture:
 *   app/dashboard/page.tsx (async, load data)
 *     → services/dashboard/dashboard.service.ts (aggregate)
 *       → repositories/* (DB access)
 *         → Supabase
 *
 * No component should access repositories directly.
 */

import { RawPostsRepository } from "@/lib/db/repositories/raw-posts.repository";
import { PainPointsRepository } from "@/lib/db/repositories/pain-points.repository";
import { PainClustersRepository } from "@/lib/db/repositories/pain-clusters.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { StartupIdeasRepository } from "@/lib/db/repositories/startup-ideas.repository";
import { PipelineRunsRepository } from "@/lib/db/repositories/pipeline-runs.repository";
import { EmbeddingsRepository } from "@/lib/db/repositories/embeddings.repository";
import { SavedOpportunitiesRepository } from "@/lib/db/repositories/saved-opportunities.repository";
import { WatchlistsRepository } from "@/lib/db/repositories/watchlists.repository";
import { AlertsRepository } from "@/lib/db/repositories/alerts.repository";
import { WeeklyDigestsRepository } from "@/lib/db/repositories/weekly-digests.repository";
import { OpportunityValidationsRepository } from "@/lib/db/repositories/opportunity-validations.repository";
import type {
  DashboardStats,
  OpportunityCardData,
  StartupIdeaCardData,
} from "@/types/dashboard";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";
import type { OpportunityFilters, StartupIdeaFilters } from "@/types/filters";

/**
 * Get dashboard stats from the database.
 *
 * @param userId - Optional user ID to get user-specific stats like saved opportunities count
 * @returns Counts for all pipeline stages plus cluster metrics
 */
export async function getDashboardStats(userId?: string): Promise<DashboardStats> {
  const [
    rawPostsRepo,
    painPointsRepo,
    painClustersRepo,
    opportunitiesRepo,
    startupIdeasRepo,
    embeddingsRepo,
    savedOpportunitiesRepo,
    watchlistsRepo,
    alertsRepo,
    weeklyDigestsRepo,
    validationsRepo,
  ] = await Promise.all([
    RawPostsRepository.create(),
    PainPointsRepository.create(),
    PainClustersRepository.create(),
    OpportunitiesRepository.create(),
    StartupIdeasRepository.create(),
    EmbeddingsRepository.create(),
    SavedOpportunitiesRepository.create(),
    WatchlistsRepository.create(),
    AlertsRepository.create(),
    WeeklyDigestsRepository.create(),
    OpportunityValidationsRepository.create(),
  ]);

  const [
    rawPosts,
    painPoints,
    clusters,
    opportunities,
    ideas,
    embeddings,
    savedCount,
    watchlistsCount,
    unreadAlertsCount,
    averageClusterSize,
    largestClusterSize,
    weeklyOpportunities,
    weeklyEmailsSent,
    validated,
  ] = await Promise.all([
    rawPostsRepo.count(),
    painPointsRepo.count(),
    painClustersRepo.count(),
    opportunitiesRepo.count(),
    startupIdeasRepo.count(),
    embeddingsRepo.count(),
    userId ? savedOpportunitiesRepo.countSaved(userId) : Promise.resolve(0),
    userId ? watchlistsRepo.countByUser(userId) : Promise.resolve(0),
    userId ? alertsRepo.countUnread(userId) : Promise.resolve(0),
    painClustersRepo.getAverageClusterSize(),
    painClustersRepo.getLargestClusterSize(),
    weeklyDigestsRepo.countOpportunitiesSince(7),
    weeklyDigestsRepo.countSent(),
    validationsRepo.count(),
  ]);

  return {
    rawPosts,
    painPoints,
    embeddings,
    clusters,
    opportunities,
    validated,
    ideas,
    savedCount,
    watchlistsCount,
    unreadAlertsCount,
    averageClusterSize,
    largestClusterSize,
    weeklyOpportunities,
    weeklyEmailsSent,
  };
}

/**
 * Get top opportunities for the dashboard.
 *
 * @param limit - Maximum number of opportunities to return (default: 10).
 * @returns Array of OpportunityCardData, ordered by score descending.
 */
export async function getTopOpportunities(
  limit = 10
): Promise<OpportunityCardData[]> {
  const opportunitiesRepo = await OpportunitiesRepository.create();
  return opportunitiesRepo.listTop(limit);
}

/**
 * Get latest startup ideas for the dashboard.
 *
 * @param limit - Maximum number of ideas to return (default: 10).
 * @returns Array of StartupIdeaCardData, ordered by created_at descending.
 */
export async function getLatestStartupIdeas(
  limit = 10
): Promise<StartupIdeaCardData[]> {
  const startupIdeasRepo = await StartupIdeasRepository.create();
  return startupIdeasRepo.listLatest(limit);
}

/**
 * Get filtered opportunities.
 */
export async function getFilteredOpportunities(
  filters: OpportunityFilters
): Promise<OpportunityCardData[]> {
  const opportunitiesRepo = await OpportunitiesRepository.create();
  return opportunitiesRepo.search(filters);
}

/**
 * Get filtered startup ideas.
 */
export async function getFilteredStartupIdeas(
  filters: StartupIdeaFilters
): Promise<StartupIdeaCardData[]> {
  const startupIdeasRepo = await StartupIdeasRepository.create();
  return startupIdeasRepo.search(filters);
}

/**
 * Get latest pipeline runs.
 */
export async function getLatestPipelineRuns(
  limit = 10
): Promise<PipelineRunHistory[]> {
  const pipelineRunsRepo = await PipelineRunsRepository.create();
  return pipelineRunsRepo.listLatest(limit);
}
