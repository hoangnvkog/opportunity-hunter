/**
 * Opportunity Scoring Engine v2
 *
 * Calculates weighted opportunity scores based on multiple factors:
 * - frequency (25%): How often the pain point appears
 * - severity (25%): How severe the pain is
 * - buying_intent (25%): Willingness to pay for a solution
 * - cluster_size (10%): Number of related pain points
 * - recency_score (10%): How recent the posts are
 * - source_diversity (5%): Variety of sources where pain appears
 *
 * All inputs are normalized to 0-1 range before weighting.
 * Final score is 0-100.
 */

export interface ScoringInput {
  frequency: number;
  severity: number;
  buying_intent: number;
  cluster_size?: number;
  recency_score?: number;
  source_diversity?: number;
}

/**
 * Weights for each scoring factor (must sum to 1.0)
 */
const WEIGHTS = {
  frequency: 0.25,
  severity: 0.25,
  buying_intent: 0.25,
  cluster_size: 0.10,
  recency_score: 0.10,
  source_diversity: 0.05,
} as const;

/**
 * Clamp a value between 0 and 1
 */
function normalize(value: number | undefined, defaultValue = 0.5): number {
  const val = value ?? defaultValue;
  return Math.max(0, Math.min(1, val));
}

/**
 * Calculate opportunity score using weighted factors
 *
 * @param input - Scoring factors
 * @returns Score between 0-100
 */
export function calculateOpportunityScore(input: ScoringInput): number {
  const normalized = {
    frequency: normalize(input.frequency),
    severity: normalize(input.severity),
    buying_intent: normalize(input.buying_intent),
    cluster_size: normalize(input.cluster_size),
    recency_score: normalize(input.recency_score),
    source_diversity: normalize(input.source_diversity),
  };

  const weightedSum =
    normalized.frequency * WEIGHTS.frequency +
    normalized.severity * WEIGHTS.severity +
    normalized.buying_intent * WEIGHTS.buying_intent +
    normalized.cluster_size * WEIGHTS.cluster_size +
    normalized.recency_score * WEIGHTS.recency_score +
    normalized.source_diversity * WEIGHTS.source_diversity;

  return Math.round(weightedSum * 100);
}

/**
 * Calculate recency score based on days since the most recent post
 *
 * Recent posts (0-7 days) → higher score (0.8-1.0)
 * Older posts (30+ days) → lower score (0.2-0.4)
 *
 * @param daysAgo - Number of days since the most recent post
 * @returns Normalized recency score (0-1)
 */
export function calculateRecencyScore(daysAgo: number): number {
  // Linear decay: score = 1 - (days / 30), clamped to [0.2, 1.0]
  const score = 1 - (daysAgo / 30);
  return Math.max(0.2, Math.min(1.0, score));
}

/**
 * Calculate source diversity score based on number of distinct sources
 *
 * More sources → higher confidence in the pain point
 *
 * @param sourceCount - Number of distinct sources
 * @returns Normalized source diversity score (0-1)
 */
export function calculateSourceDiversityScore(sourceCount: number): number {
  // Normalize: 1 source = 0.2, 5+ sources = 1.0
  const score = 0.2 + (sourceCount * 0.16);
  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate cluster size score based on number of pain points in cluster
 *
 * Larger clusters indicate more widespread pain
 *
 * @param clusterSize - Number of pain points in the cluster
 * @returns Normalized cluster size score (0-1)
 */
export function calculateClusterSizeScore(clusterSize: number): number {
  // Normalize: 1 point = 0.2, 10+ points = 1.0
  const score = 0.2 + (clusterSize * 0.08);
  return Math.max(0, Math.min(1, score));
}
