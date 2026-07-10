import { PainClustersRepository } from "@/lib/db/repositories/pain-clusters.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { PainPointsRepository } from "@/lib/db/repositories/pain-points.repository";
import { RawPostsRepository } from "@/lib/db/repositories/raw-posts.repository";
import { AlertsRepository } from "@/lib/db/repositories/alerts.repository";
import { WatchlistsRepository } from "@/lib/db/repositories/watchlists.repository";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";
import {
  calculateOpportunityScore,
  calculateRecencyScore,
  calculateSourceDiversityScore,
  calculateClusterSizeScore,
} from "@/lib/scoring/opportunity-score";
import type { PainClusterInput, OpportunityInput } from "@/types/pipeline";

/** Score statistics for pipeline logging. */
export interface OpportunityScoreStats {
  average_score: number;
  highest_score: number;
  lowest_score: number;
}

/**
 * Enrichment data gathered from the database to feed the scoring engine.
 */
interface EnrichmentData {
  clusterSize: number;
  recencyScore: number;
  sourceDiversityScore: number;
}

/**
 * Gather enrichment data from the database for scoring.
 *
 * Queries pain_points and raw_posts to derive:
 * - cluster_size: approximate count of clustered pain points
 * - recency_score: how recent the source posts are
 * - source_diversity: number of distinct sources
 */
async function gatherEnrichmentData(): Promise<EnrichmentData> {
  const [painPointsRepo, rawPostsRepo] = await Promise.all([
    PainPointsRepository.create(),
    RawPostsRepository.create(),
  ]);

  // Get recent raw posts to calculate recency and source diversity
  const recentPosts = await rawPostsRepo.list({ limit: 200 });

  // Source diversity: count distinct sources
  const distinctSources = new Set(recentPosts.map((p) => p.source));
  const sourceDiversityScore = calculateSourceDiversityScore(distinctSources.size);

  // Recency: days since the most recent post
  let recencyScore = 0.5; // default if no posts
  if (recentPosts.length > 0) {
    const mostRecentDate = new Date(
      Math.max(...recentPosts.map((p) => new Date(p.created_at).getTime()))
    );
    const daysAgo = Math.floor(
      (Date.now() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    recencyScore = calculateRecencyScore(daysAgo);
  }

  // Cluster size: count of clustered pain points as approximation
  const allPainPoints = await painPointsRepo.list({ limit: 500 });
  const clusteredCount = allPainPoints.filter((p) => p.clustered).length;
  const clusterSize = clusteredCount;
  // We don't normalize here — the scoring engine normalizes internally
  void clusterSize;

  return {
    clusterSize: clusteredCount,
    recencyScore,
    sourceDiversityScore,
  };
}

/**
 * Generate opportunities from clusters that don't have opportunities yet.
 * Uses incremental processing: only processes clusters where opportunity_generated = false.
 *
 * Scoring Engine v2: scores are now calculated using a weighted combination of
 * frequency, severity, buying_intent, cluster_size, recency, and source_diversity.
 */
export async function generateOpportunitiesFromDatabase(limit = 50): Promise<{
  processed: number;
  generated: number;
  inserted: number;
  scoreStats: OpportunityScoreStats;
}> {
  const clustersRepo = await PainClustersRepository.create();
  const opportunitiesRepo = await OpportunitiesRepository.create();

  // Fetch only clusters that haven't generated opportunities
  const unprocessedClusters = await clustersRepo.listUnprocessedForOpportunities(limit);

  if (unprocessedClusters.length === 0) {
    return {
      processed: 0,
      generated: 0,
      inserted: 0,
      scoreStats: { average_score: 0, highest_score: 0, lowest_score: 0 },
    };
  }

  const provider = getAIProviderFromEnv();

  // Convert to pipeline input
  const inputs: PainClusterInput[] = unprocessedClusters.map((c) => ({
    cluster_name: c.name,
    description: c.description,
    pain_point_indexes: [],
  }));

  // Generate opportunities using AI
  const opportunities: OpportunityInput[] = await provider.generateOpportunities(inputs);

  if (opportunities.length === 0) {
    return {
      processed: 0,
      generated: 0,
      inserted: 0,
      scoreStats: { average_score: 0, highest_score: 0, lowest_score: 0 },
    };
  }

  // Gather enrichment data from the database
  const enrichment = await gatherEnrichmentData();

  let inserted = 0;
  const processedClusterIds: string[] = [];
  const scores: number[] = [];

  // Insert opportunities and mark clusters as processed
  for (let i = 0; i < opportunities.length; i++) {
    const cluster = unprocessedClusters[i];
    const opportunity = opportunities[i];

    if (!cluster || !opportunity) continue;

    try {
      // Use AI-provided values or enrichment defaults
      const clusterSize = opportunity.cluster_size ?? enrichment.clusterSize;
      const recencyScore = opportunity.recency_score ?? enrichment.recencyScore;
      const sourceDiversity = opportunity.source_diversity ?? enrichment.sourceDiversityScore;

      // Calculate score using the v2 weighted scoring engine
      const score = calculateOpportunityScore({
        frequency: opportunity.frequency,
        severity: opportunity.severity,
        buying_intent: opportunity.buying_intent,
        cluster_size: calculateClusterSizeScore(clusterSize),
        recency_score: recencyScore,
        source_diversity: sourceDiversity,
      });

      scores.push(score);

      const newOpportunity = await opportunitiesRepo.create({
        cluster_id: cluster.id,
        title: opportunity.cluster_name || cluster.name,
        description: opportunity.cluster_description || cluster.description,
        score: Math.round(score).toString(), // Decimal6 = string
        frequency: opportunity.frequency,
        severity: opportunity.severity.toFixed(3), // Decimal3 = string
        buying_intent: opportunity.buying_intent.toFixed(3), // Decimal3 = string
        cluster_size: clusterSize,
        recency_score: recencyScore.toFixed(3), // Decimal3 = string
        source_diversity: sourceDiversity.toFixed(3), // Decimal3 = string
      });
      inserted++;

      // Mark cluster as processed
      await clustersRepo.markOpportunityGenerated(cluster.id);
      processedClusterIds.push(cluster.id);

      // Match opportunity to watchlists and create alerts
      try {
        await matchOpportunityToWatchlists({
          id: newOpportunity.id,
          title: opportunity.cluster_name || cluster.name,
          description: opportunity.cluster_description || cluster.description,
          score: score,
          frequency: opportunity.frequency,
          severity: opportunity.severity,
          buying_intent: opportunity.buying_intent,
        });
      } catch (alertError) {
        console.warn(`Failed to create alerts for opportunity ${newOpportunity.id}:`, alertError);
      }
    } catch (error) {
      console.error(`Failed to insert opportunity for cluster ${cluster.id}:`, error);
    }
  }

  // Calculate score statistics
  const scoreStats: OpportunityScoreStats =
    scores.length > 0
      ? {
          average_score: Math.round(
            scores.reduce((sum, s) => sum + s, 0) / scores.length
          ),
          highest_score: Math.max(...scores),
          lowest_score: Math.min(...scores),
        }
      : { average_score: 0, highest_score: 0, lowest_score: 0 };

  // Log score statistics
  if (scores.length > 0) {
    console.log(`   Generated ${inserted} opportunities`);
    console.log(`   Average score: ${scoreStats.average_score}`);
    console.log(`   Highest score: ${scoreStats.highest_score}`);
    console.log(`   Lowest score: ${scoreStats.lowest_score}`);
  }

  return {
    processed: processedClusterIds.length,
    generated: opportunities.length,
    inserted,
    scoreStats,
  };
}

/**
 * Match an opportunity against all watchlists and create alerts for matches.
 */
async function matchOpportunityToWatchlists(opportunity: {
  id: string;
  title: string;
  description: string;
  score: number;
  frequency: number;
  severity: number;
  buying_intent: number;
}): Promise<number> {
  const watchlistsRepo = await WatchlistsRepository.create();
  const alertsRepo = await AlertsRepository.create();

  // Get all watchlists
  const watchlists = await watchlistsRepo.getAllWatchlists();

  if (!watchlists || watchlists.length === 0) {
    return 0;
  }

  let alertsCreated = 0;

  for (const watchlist of watchlists) {
    const matches = checkWatchlistMatch(watchlist, opportunity);

    if (matches) {
      try {
        await alertsRepo.create({
          user_id: watchlist.user_id,
          watchlist_id: watchlist.id,
          opportunity_id: opportunity.id,
        });
        alertsCreated++;
      } catch (error) {
        console.warn(`Failed to create alert for watchlist ${watchlist.id}:`, error);
      }
    }
  }

  if (alertsCreated > 0) {
    console.log(`Created ${alertsCreated} alerts for opportunity ${opportunity.id}`);
  }

  return alertsCreated;
}

/**
 * Check if an opportunity matches a watchlist's criteria.
 */
function checkWatchlistMatch(
  watchlist: {
    search: string | null;
    min_score: number | null;
    min_frequency: number | null;
    min_severity: number | null;
    min_buying_intent: number | null;
  },
  opportunity: {
    title: string;
    description: string;
    score: number;
    frequency: number;
    severity: number;
    buying_intent: number;
  }
): boolean {
  // Check search term (case-insensitive)
  if (watchlist.search) {
    const searchTerm = watchlist.search.toLowerCase();
    const title = opportunity.title.toLowerCase();
    const description = opportunity.description.toLowerCase();

    if (!title.includes(searchTerm) && !description.includes(searchTerm)) {
      return false;
    }
  }

  // Check minimum score
  if (watchlist.min_score !== null && opportunity.score < watchlist.min_score) {
    return false;
  }

  // Check minimum frequency
  if (watchlist.min_frequency !== null && opportunity.frequency < watchlist.min_frequency) {
    return false;
  }

  // Check minimum severity
  if (watchlist.min_severity !== null && opportunity.severity < watchlist.min_severity) {
    return false;
  }

  // Check minimum buying intent
  if (watchlist.min_buying_intent !== null && opportunity.buying_intent < watchlist.min_buying_intent) {
    return false;
  }

  return true;
}
