/**
 * Sprint 51: Opportunity Validation Engine v1
 *
 * Deterministic scoring service — no AI required.
 *
 * Formula:
 *   validation_score =
 *     market_demand * 0.30 +
 *     pain_severity * 0.25 +
 *     buying_intent * 0.25 +
 *     competition_risk * 0.20
 *
 * All inputs normalised to 0-100 before weighting.
 */

import type { OpportunityRow } from "@/types";
import { OpportunityValidationsRepository } from "@/lib/db/repositories/opportunity-validations.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";

// ---------------------------------------------------------------------------
// Weights (must sum to 1.0)
// ---------------------------------------------------------------------------

const WEIGHTS = {
  market_demand: 0.30,
  pain_severity: 0.25,
  buying_intent: 0.25,
  competition_risk: 0.20,
} as const;

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

/** Clamp a value to [0, 1]. */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// ---------------------------------------------------------------------------
// Factor calculators
// ---------------------------------------------------------------------------

/**
 * Market Demand: combines frequency, severity (as proxy for pain volume),
 * and buying_intent to gauge how many people actually want this solved.
 *
 *   market_demand = frequency_norm * 0.40 + severity * 0.30 + buying_intent * 0.30
 */
function calcMarketDemand(opp: OpportunityRow): number {
  // frequency is raw count — normalise with logarithmic scale (cap ~100)
  const frequencyNorm = Math.min(opp.frequency / 50, 1);
  const severity = clamp01(parseFloat(opp.severity) ?? 0.5);
  const buying = clamp01(parseFloat(opp.buying_intent) ?? 0.5);

  return Math.round(
    (frequencyNorm * 0.40 + severity * 0.30 + buying * 0.30) * 100,
  );
}

/**
 * Pain Severity: derived directly from severity column + buying_intent
 * (people who show buying intent are experiencing acute pain).
 *
 *   pain_severity = severity * 0.70 + buying_intent * 0.30
 */
function calcPainSeverity(opp: OpportunityRow): number {
  const severity = clamp01(parseFloat(opp.severity) ?? 0.5);
  const buying = clamp01(parseFloat(opp.buying_intent) ?? 0.5);

  return Math.round((severity * 0.70 + buying * 0.30) * 100);
}

/**
 * Buying Intent: direct from the buying_intent column, enriched with
 * frequency as a signal that people are actively looking for solutions.
 *
 *   buying_intent = buying_intent_col * 0.70 + frequency_norm * 0.30
 */
function calcBuyingIntent(opp: OpportunityRow): number {
  const buying = clamp01(parseFloat(opp.buying_intent) ?? 0.5);
  const frequencyNorm = Math.min(opp.frequency / 50, 1);

  return Math.round((buying * 0.70 + frequencyNorm * 0.30) * 100);
}

/**
 * Competition Risk: inverted — high competition means LOWER score.
 * Uses cluster_size as a proxy: more clustered pain points can indicate
 * a crowded space. Recency and source_diversity help gauge freshness.
 *
 * competition_risk = (1 - cluster_density) * 0.50 +
 *                    recency_score * 0.25 +
 *                    source_diversity * 0.25
 *
 * Lower competition risk = higher validation score.
 */
function calcCompetitionRisk(opp: OpportunityRow): number {
  // cluster_size as proxy for competition density
  // Higher cluster_size = more people talking about it = potentially more competition
  const clusterSize = opp.cluster_size ?? 0;
  const clusterDensity = clamp01(clusterSize / 20); // cap at 20 points

  const recency = clamp01(parseFloat(opp.recency_score ?? "0.5") ?? 0.5);
  const sourceDiv = clamp01(parseFloat(opp.source_diversity ?? "0.5") ?? 0.5);

  return Math.round(((1 - clusterDensity) * 0.50 + recency * 0.25 + sourceDiv * 0.25) * 100);
}

// ---------------------------------------------------------------------------
// Core scoring function
// ---------------------------------------------------------------------------

/**
 * Calculate the overall validation score from sub-factors.
 */
export function calculateValidationScore(factors: {
  market_demand: number;
  pain_severity: number;
  buying_intent: number;
  competition_risk: number;
}): number {
  const total =
    factors.market_demand * WEIGHTS.market_demand +
    factors.pain_severity * WEIGHTS.pain_severity +
    factors.buying_intent * WEIGHTS.buying_intent +
    factors.competition_risk * WEIGHTS.competition_risk;

  return Math.round(total);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate a single opportunity and upsert the result.
 *
 * @param opportunityId - UUID of the opportunity to validate
 * @returns The validation result
 */
export async function validateOpportunity(
  opportunityId: string,
): Promise<{
  validation_score: number;
  market_demand: number;
  pain_severity: number;
  buying_intent: number;
  competition_risk: number;
}> {
  const oppRepo = await OpportunitiesRepository.create();
  const valRepo = await OpportunityValidationsRepository.create();

  const opp = await oppRepo.findById(opportunityId);
  if (!opp) throw new Error(`Opportunity ${opportunityId} not found`);

  // Calculate sub-factors
  const marketDemand = calcMarketDemand(opp);
  const painSeverity = calcPainSeverity(opp);
  const buyingIntent = calcBuyingIntent(opp);
  const competitionRisk = calcCompetitionRisk(opp);

  // Calculate overall score
  const validationScore = calculateValidationScore({
    market_demand: marketDemand,
    pain_severity: painSeverity,
    buying_intent: buyingIntent,
    competition_risk: competitionRisk,
  });

  // Upsert validation record
  await valRepo.upsert({
    opportunity_id: opportunityId,
    validation_score: validationScore.toFixed(2),
    market_demand: marketDemand.toFixed(2),
    pain_severity: painSeverity.toFixed(2),
    buying_intent: buyingIntent.toFixed(2),
    competition_risk: competitionRisk.toFixed(2),
  });

  return {
    validation_score: validationScore,
    market_demand: marketDemand,
    pain_severity: painSeverity,
    buying_intent: buyingIntent,
    competition_risk: competitionRisk,
  };
}

/**
 * Validate all unvalidated opportunities.
 *
 * @param limit - Maximum number of opportunities to process (default: 100)
 * @returns Counts: total, validated, skipped
 */
export async function validateAllOpportunities(
  limit: number = 100,
): Promise<{
  total: number;
  validated: number;
  skipped: number;
}> {
  const oppRepo = await OpportunitiesRepository.create();
  const valRepo = await OpportunityValidationsRepository.create();

  // Get all opportunities
  const opportunities = await oppRepo.list({ limit: limit + 500 });

  if (opportunities.length === 0) {
    return { total: 0, validated: 0, skipped: 0 };
  }

  // Find which ones already have validations
  const existingValidations = await valRepo.list({ limit: 1000 });
  const validatedOpportunityIds = new Set(
    existingValidations.map((v) => v.opportunity_id),
  );

  let validated = 0;
  let skipped = 0;

  for (const opp of opportunities) {
    if (validatedOpportunityIds.has(opp.id)) {
      skipped++;
      continue;
    }

    try {
      await validateOpportunity(opp.id);
      validated++;
    } catch (error) {
      console.error(`Failed to validate opportunity ${opp.id}:`, error);
      skipped++;
    }
  }

  return {
    total: opportunities.length,
    validated,
    skipped,
  };
}
