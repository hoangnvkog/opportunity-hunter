/**
 * Sprint 55: Market Intelligence Service
 *
 * Responsibilities:
 * - Load opportunities with validation_score >= 70 AND forecast_score >= 70
 * - Call AI provider to generate market intelligence (6 signals + overall)
 * - Persist intelligence records to database
 * - Trigger "Massive Market Signal" alerts when overall_score > 90
 * - Track analytics events
 *
 * Architecture:
 * - Service is the only place that orchestrates the AI provider +
 *   repository + alert trigger.
 * - AI layer returns business data only (no UUIDs, no FKs).
 * - Repository owns all persistence.
 */

import type { OpportunityInput } from "@/types/pipeline";
import type {
  MarketIntelligenceCardData,
  MarketIntelligenceGenerationResult,
  MarketIntelligenceRow,
  MarketIntelligenceStats,
} from "@/types/market-intelligence";
import { createAIProvider, getAIProviderFromEnv } from "@/lib/ai";
import { MarketIntelligenceRepository } from "@/lib/db/repositories/market-intelligence.repository";
import { OpportunityValidationsRepository } from "@/lib/db/repositories/opportunity-validations.repository";
import { OpportunityForecastsRepository } from "@/lib/db/repositories/opportunity-forecasts.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";

/**
 * Threshold above which we trigger a "Massive Market Signal" alert.
 */
export const MASSIVE_SIGNAL_THRESHOLD = 90;

export type AIProviderType = "mock" | "openai" | "gemini";

function buildProvider(providerType?: AIProviderType) {
  return providerType
    ? createAIProvider({ type: providerType })
    : getAIProviderFromEnv();
}

function buildOpportunityInput(
  opportunityId: string,
  score: number,
  title: string,
  description: string | null,
  frequency: number,
  severity: number,
  buyingIntent: number,
): OpportunityInput {
  return {
    id: opportunityId,
    score,
    frequency,
    severity,
    buying_intent: buyingIntent,
    cluster_name: title,
    cluster_description: description ?? "(no description)",
  };
}

/**
 * Generate market intelligence for a single opportunity (if eligible).
 *
 * Gates:
 * - validation_score >= 70
 * - forecast_score >= 70
 *
 * @returns Generation result with processed/generated/skipped/inserted counts
 */
export async function generate(
  opportunityId: string,
  providerType?: AIProviderType,
): Promise<MarketIntelligenceGenerationResult> {
  const intelligenceRepo = await MarketIntelligenceRepository.create();
  const validationRepo = await OpportunityValidationsRepository.create();
  const forecastRepo = await OpportunityForecastsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  const opportunity = await opportunityRepo.findById(opportunityId);
  if (!opportunity) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const [validation, forecast] = await Promise.all([
    validationRepo.findByOpportunityId(opportunityId),
    forecastRepo.findByOpportunity(opportunityId),
  ]);

  if (!validation || !forecast) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  const validationScore = Number(validation.validation_score);
  const forecastScore = Number(forecast.forecast_score);

  if (validationScore < 70 || forecastScore < 70) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  const opportunityInput = buildOpportunityInput(
    opportunityId,
    validationScore,
    opportunity.title,
    opportunity.description,
    opportunity.frequency,
    Number(opportunity.severity ?? 0),
    Number(opportunity.buying_intent ?? 0),
  );

  const provider = buildProvider(providerType);
  const [intelligence] = await provider.generateMarketIntelligence([opportunityInput]);

  if (!intelligence) {
    return { processed: 1, generated: 0, skipped: 0, inserted: 0 };
  }

  // Idempotent: delete existing before inserting new
  await intelligenceRepo.deleteByOpportunity(opportunityId);

  await intelligenceRepo.create({
    opportunity_id: opportunityId,
    reddit_score: round2(intelligence.reddit_score),
    github_score: round2(intelligence.github_score),
    product_hunt_score: round2(intelligence.product_hunt_score),
    news_score: round2(intelligence.news_score),
    google_trends_score: round2(intelligence.google_trends_score),
    jobs_score: round2(intelligence.jobs_score),
    overall_score: round2(intelligence.overall_score),
    confidence: round2(intelligence.confidence),
    summary: intelligence.summary,
  });

  // Analytics: track generation
  emitAnalytics({
    event: "market_intelligence_generated",
    opportunityId,
    overallScore: intelligence.overall_score,
    confidence: intelligence.confidence,
  });

  // Alert: trigger if overall_score > 90
  await triggerMassiveSignalAlertIfNeeded(
    opportunityId,
    intelligence.overall_score,
    opportunity.title,
  );

  return { processed: 1, generated: 1, skipped: 0, inserted: 1 };
}

/**
 * Generate market intelligence in batch for all eligible opportunities.
 *
 * Eligibility:
 * - validation_score >= 70
 * - forecast_score >= 70
 *
 * @param limit - Maximum number of opportunities to process
 * @param providerType - Override AI provider type
 */
export async function generateBatch(
  limit: number = 50,
  providerType?: AIProviderType,
): Promise<MarketIntelligenceGenerationResult> {
  const intelligenceRepo = await MarketIntelligenceRepository.create();
  const validationRepo = await OpportunityValidationsRepository.create();
  const forecastRepo = await OpportunityForecastsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  const validations = await validationRepo.list({ minScore: 70, limit });

  if (validations.length === 0) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const validOppIds = validations.map((v) => v.opportunity_id);
  const opportunities = await opportunityRepo.findByIds(validOppIds);

  // Filter to opportunities that ALSO have forecast_score >= 70
  const forecasts = await Promise.all(
    opportunities.map((opp) => forecastRepo.findByOpportunity(opp.id)),
  );

  const eligible: Array<{
    opportunityId: string;
    validationScore: number;
    forecastScore: number;
    title: string;
    description: string | null;
    frequency: number;
    severity: number;
    buyingIntent: number;
  }> = [];

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];
    const fc = forecasts[i];
    if (!opp || !fc) continue;
    if (Number(fc.forecast_score) < 70) continue;
    eligible.push({
      opportunityId: opp.id,
      validationScore: Number(validations.find((v) => v.opportunity_id === opp.id)?.validation_score ?? 0),
      forecastScore: Number(fc.forecast_score),
      title: opp.title,
      description: opp.description,
      frequency: opp.frequency,
      severity: Number(opp.severity ?? 0),
      buyingIntent: Number(opp.buying_intent ?? 0),
    });
  }

  if (eligible.length === 0) {
    return { processed: validations.length, generated: 0, skipped: validations.length, inserted: 0 };
  }

  const aiInputs: OpportunityInput[] = eligible.map((e) =>
    buildOpportunityInput(
      e.opportunityId,
      e.validationScore,
      e.title,
      e.description,
      e.frequency,
      e.severity,
      e.buyingIntent,
    ),
  );

  const provider = buildProvider(providerType);
  const intelligenceResults = await provider.generateMarketIntelligence(aiInputs);

  let totalInserted = 0;
  let totalGenerated = 0;
  let highestScore = 0;

  for (let i = 0; i < eligible.length; i++) {
    const opp = eligible[i];
    const intel = intelligenceResults[i];
    if (!opp || !intel) continue;

    totalGenerated++;
    if (intel.overall_score > highestScore) highestScore = intel.overall_score;

    // Idempotent
    await intelligenceRepo.deleteByOpportunity(opp.opportunityId);

    await intelligenceRepo.create({
      opportunity_id: opp.opportunityId,
      reddit_score: round2(intel.reddit_score),
      github_score: round2(intel.github_score),
      product_hunt_score: round2(intel.product_hunt_score),
      news_score: round2(intel.news_score),
      google_trends_score: round2(intel.google_trends_score),
      jobs_score: round2(intel.jobs_score),
      overall_score: round2(intel.overall_score),
      confidence: round2(intel.confidence),
      summary: intel.summary,
    });
    totalInserted++;

    // Analytics
    emitAnalytics({
      event: "market_intelligence_generated",
      opportunityId: opp.opportunityId,
      overallScore: intel.overall_score,
      confidence: intel.confidence,
    });

    // Alert if score exceeds threshold
    await triggerMassiveSignalAlertIfNeeded(
      opp.opportunityId,
      intel.overall_score,
      opp.title,
    );
  }

  // Aggregate analytics events
  if (totalInserted > 0) {
    emitAnalytics({
      event: "average_market_score",
      value: intelligenceResults
        .filter(Boolean)
        .reduce((acc, i) => acc + i.overall_score, 0) / totalInserted,
    });
    emitAnalytics({
      event: "highest_market_score",
      value: highestScore,
    });
  }

  return {
    processed: eligible.length,
    generated: totalGenerated,
    skipped: validations.length - eligible.length,
    inserted: totalInserted,
  };
}

/**
 * Get top market intelligence signals, sorted by overall_score desc.
 */
export async function getTopSignals(
  limit: number = 10,
): Promise<MarketIntelligenceCardData[]> {
  const repo = await MarketIntelligenceRepository.create();
  return repo.listCards({ limit });
}

/**
 * Aggregate market intelligence stats for dashboard.
 */
export async function getStats(): Promise<MarketIntelligenceStats> {
  const repo = await MarketIntelligenceRepository.create();
  const stats = await repo.getStats();

  return {
    total: stats.total,
    averageOverallScore: stats.averageOverallScore,
    highestOverallScore: stats.highestOverallScore,
    averageConfidence: stats.averageConfidence,
    averageRedditScore: stats.averageRedditScore,
    averageGithubScore: stats.averageGithubScore,
    averageProductHuntScore: stats.averageProductHuntScore,
    averageNewsScore: stats.averageNewsScore,
    averageGoogleTrendsScore: stats.averageGoogleTrendsScore,
    averageJobsScore: stats.averageJobsScore,
  };
}

/**
 * Get market intelligence for one opportunity.
 */
export async function getOpportunityIntelligence(
  opportunityId: string,
): Promise<MarketIntelligenceRow | null> {
  const repo = await MarketIntelligenceRepository.create();
  return repo.findByOpportunity(opportunityId);
}

/**
 * Find the most-discussed opportunity (highest overall_score).
 * Returns null when no intelligence records exist.
 */
export async function getMostDiscussedOpportunity(): Promise<{
  opportunityId: string;
  overallScore: number;
} | null> {
  const repo = await MarketIntelligenceRepository.create();
  const oppId = await repo.mostDiscussedOpportunityId();
  if (!oppId) return null;
  const record = await repo.findByOpportunity(oppId);
  if (!record) return null;
  return {
    opportunityId: oppId,
    overallScore: record.overall_score,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function emitAnalytics(payload: Record<string, unknown>): void {
  // Project has no event-tracking pipeline; AnalyticsService reads metrics
  // from DB on demand, so we emit a structured log line that downstream
  // log-based analytics (system_logs) can pick up.
  console.info("[analytics] market_intelligence", JSON.stringify(payload));
}

/**
 * If overall_score > threshold, create a "🔥 Massive Market Signal" alert
 * for every user whose watchlist matches the opportunity. Idempotent.
 */
async function triggerMassiveSignalAlertIfNeeded(
  opportunityId: string,
  overallScore: number,
  _opportunityTitle: string,
): Promise<void> {
  if (overallScore <= MASSIVE_SIGNAL_THRESHOLD) return;

  try {
    const { MatchingService } = await import("@/services/matching/matching.service");
    const { AlertsRepository } = await import("@/lib/db/repositories/alerts.repository");
    const { EmailService } = await import("@/services/email/email.service");
    const { getSupabaseServiceClient } = await import("@/lib/supabase");
    const { OpportunitiesRepository } = await import("@/lib/db/repositories/opportunities.repository");

    const client = getSupabaseServiceClient();
    const matchingService = new MatchingService(client);
    const alertsRepo = new AlertsRepository(client);
    const opportunityRepo = await OpportunitiesRepository.create();
    const emailService = await EmailService.create();

    const opportunity = await opportunityRepo.findById(opportunityId);
    if (!opportunity) return;

    const matches = await matchingService.matchOpportunityToWatchlists(opportunity);
    if (matches.length === 0) return;

    for (const match of matches) {
      const existing = await alertsRepo.findByWatchlistAndOpportunity(
        match.watchlistId,
        opportunityId,
      );
      if (existing) continue;

      const alert = await alertsRepo.create({
        user_id: match.userId,
        watchlist_id: match.watchlistId,
        opportunity_id: opportunityId,
      });

      try {
        await emailService.queueAlertEmail(match.userId, alert.id);
      } catch (err) {
        console.error(
          `[MarketIntelligence] Failed to queue email for user ${match.userId}:`,
          err,
        );
      }
    }
  } catch (err) {
    console.error(`[MarketIntelligence] Failed to trigger alert:`, err);
  }
}