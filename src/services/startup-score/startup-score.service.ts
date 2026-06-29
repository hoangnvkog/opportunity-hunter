/**
 * Sprint 56: Startup Investment Scoring Service
 *
 * Responsibilities:
 * - Load opportunities with ALL THREE gates passed:
 *     validation_score >= 70
 *     forecast_score >= 70
 *     market_intelligence overall_score >= 70
 * - Call AI provider to score startup potential (7 dimensions + overall)
 * - Persist score records to database
 * - Trigger "Investment Grade Startup" alerts when overall_score >= 90
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
  StartupScoreCardData,
  StartupScoreGenerationResult,
  StartupScoreInput,
  StartupScoreRow,
  StartupScoreStats,
} from "@/types/startup-score";
import { createAIProvider, getAIProviderFromEnv } from "@/lib/ai";
import { StartupScoresRepository } from "@/lib/db/repositories/startup-scores.repository";
import { MarketIntelligenceRepository } from "@/lib/db/repositories/market-intelligence.repository";
import { OpportunityValidationsRepository } from "@/lib/db/repositories/opportunity-validations.repository";
import { OpportunityForecastsRepository } from "@/lib/db/repositories/opportunity-forecasts.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { INVESTMENT_GRADE_THRESHOLD } from "@/lib/db/repositories/startup-scores.repository";

/**
 * Threshold above which we trigger an "Investment Grade Startup" alert.
 * Matches INVESTMENT_GRADE_THRESHOLD in the repository.
 */
export const INVESTMENT_GRADE_ALERT_THRESHOLD = INVESTMENT_GRADE_THRESHOLD;

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
 * Generate investment score for a single opportunity (if eligible).
 *
 * Gates:
 * - validation_score >= 70
 * - forecast_score >= 70
 * - market_intelligence overall_score >= 70
 */
export async function generate(
  opportunityId: string,
  providerType?: AIProviderType,
): Promise<StartupScoreGenerationResult> {
  const scoresRepo = await StartupScoresRepository.create();
  const intelligenceRepo = await MarketIntelligenceRepository.create();
  const validationRepo = await OpportunityValidationsRepository.create();
  const forecastRepo = await OpportunityForecastsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  const opportunity = await opportunityRepo.findById(opportunityId);
  if (!opportunity) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const [validation, forecast, intelligence] = await Promise.all([
    validationRepo.findByOpportunityId(opportunityId),
    forecastRepo.findByOpportunity(opportunityId),
    intelligenceRepo.findByOpportunity(opportunityId),
  ]);

  if (!validation || !forecast || !intelligence) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  const validationScore = Number(validation.validation_score);
  const forecastScore = Number(forecast.forecast_score);
  const intelligenceScore = Number(intelligence.overall_score);

  if (
    validationScore < 70 ||
    forecastScore < 70 ||
    intelligenceScore < 70
  ) {
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
  const [score] = await provider.scoreStartupPotential([opportunityInput]);

  if (!score) {
    return { processed: 1, generated: 0, skipped: 0, inserted: 0 };
  }

  // Idempotent: delete existing before inserting new
  await scoresRepo.deleteByOpportunity(opportunityId);

  await scoresRepo.create({
    opportunity_id: opportunityId,
    tam_score: round2(score.tam_score),
    market_timing_score: round2(score.market_timing_score),
    competition_score: round2(score.competition_score),
    moat_score: round2(score.moat_score),
    distribution_score: round2(score.distribution_score),
    execution_score: round2(score.execution_score),
    capital_efficiency_score: round2(score.capital_efficiency_score),
    overall_score: round2(score.overall_score),
    confidence: round2(score.confidence),
    recommendation: score.recommendation,
    summary: score.summary,
  });

  // Analytics: track generation
  emitAnalytics({
    event: "startup_scored",
    opportunityId,
    overallScore: score.overall_score,
    recommendation: score.recommendation,
  });

  // Alert: trigger if overall_score >= 90 (Investment Grade)
  await triggerInvestmentGradeAlertIfNeeded(
    opportunityId,
    score.overall_score,
    score.recommendation,
    opportunity.title,
  );

  return { processed: 1, generated: 1, skipped: 0, inserted: 1 };
}

/**
 * Generate investment scores in batch for all eligible opportunities.
 *
 * Eligibility:
 * - validation_score >= 70
 * - forecast_score >= 70
 * - market_intelligence overall_score >= 70
 *
 * @param limit - Maximum number of opportunities to process
 * @param providerType - Override AI provider type
 */
export async function generateBatch(
  limit: number = 50,
  providerType?: AIProviderType,
): Promise<StartupScoreGenerationResult> {
  const scoresRepo = await StartupScoresRepository.create();
  const intelligenceRepo = await MarketIntelligenceRepository.create();
  const validationRepo = await OpportunityValidationsRepository.create();
  const forecastRepo = await OpportunityForecastsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  // Get all opportunities with market_intelligence overall_score >= 70.
  // (intelligence already implies validation+forecast were generated.)
  const intelligenceCards = await intelligenceRepo.listCards({ limit, minScore: 70 });
  if (intelligenceCards.length === 0) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const intelligenceOppIds = intelligenceCards.map((i) => i.opportunity_id);
  const opportunities = await opportunityRepo.findByIds(intelligenceOppIds);

  // Verify each still has validation AND forecast >= 70 (defense in depth)
  const eligible: Array<{
    opportunityId: string;
    validationScore: number;
    forecastScore: number;
    intelligenceScore: number;
    title: string;
    description: string | null;
    frequency: number;
    severity: number;
    buyingIntent: number;
  }> = [];

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];
    if (!opp) continue;

    const intel = intelligenceCards.find((ic) => ic.opportunity_id === opp.id);
    if (!intel) continue;

    const [validation, forecast] = await Promise.all([
      validationRepo.findByOpportunityId(opp.id),
      forecastRepo.findByOpportunity(opp.id),
    ]);
    if (!validation || !forecast) continue;
    if (Number(validation.validation_score) < 70) continue;
    if (Number(forecast.forecast_score) < 70) continue;

    eligible.push({
      opportunityId: opp.id,
      validationScore: Number(validation.validation_score),
      forecastScore: Number(forecast.forecast_score),
      intelligenceScore: intel.overall_score,
      title: opp.title,
      description: opp.description,
      frequency: opp.frequency,
      severity: Number(opp.severity ?? 0),
      buyingIntent: Number(opp.buying_intent ?? 0),
    });
  }

  if (eligible.length === 0) {
    return {
      processed: intelligenceCards.length,
      generated: 0,
      skipped: intelligenceCards.length,
      inserted: 0,
    };
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
  const scoreResults = await provider.scoreStartupPotential(aiInputs);

  let totalInserted = 0;
  let totalGenerated = 0;
  let totalInvestmentGrade = 0;
  let highestScore = 0;
  let scoreSum = 0;

  for (let i = 0; i < eligible.length; i++) {
    const opp = eligible[i];
    const score = scoreResults[i];
    if (!opp || !score) continue;

    totalGenerated++;
    scoreSum += score.overall_score;
    if (score.overall_score > highestScore) highestScore = score.overall_score;
    if (score.overall_score >= INVESTMENT_GRADE_ALERT_THRESHOLD) {
      totalInvestmentGrade++;
    }

    // Idempotent
    await scoresRepo.deleteByOpportunity(opp.opportunityId);

    await scoresRepo.create({
      opportunity_id: opp.opportunityId,
      tam_score: round2(score.tam_score),
      market_timing_score: round2(score.market_timing_score),
      competition_score: round2(score.competition_score),
      moat_score: round2(score.moat_score),
      distribution_score: round2(score.distribution_score),
      execution_score: round2(score.execution_score),
      capital_efficiency_score: round2(score.capital_efficiency_score),
      overall_score: round2(score.overall_score),
      confidence: round2(score.confidence),
      recommendation: score.recommendation,
      summary: score.summary,
    });
    totalInserted++;

    // Analytics
    emitAnalytics({
      event: "startup_scored",
      opportunityId: opp.opportunityId,
      overallScore: score.overall_score,
      recommendation: score.recommendation,
    });

    // Alert if score >= 90 (Investment Grade)
    await triggerInvestmentGradeAlertIfNeeded(
      opp.opportunityId,
      score.overall_score,
      score.recommendation,
      opp.title,
    );
  }

  // Aggregate analytics events
  if (totalInserted > 0) {
    emitAnalytics({
      event: "average_startup_score",
      value: scoreSum / totalInserted,
    });
    emitAnalytics({
      event: "highest_startup_score",
      value: highestScore,
    });
    emitAnalytics({
      event: "investment_grade_count",
      value: totalInvestmentGrade,
    });
  }

  return {
    processed: eligible.length,
    generated: totalGenerated,
    skipped: intelligenceCards.length - eligible.length,
    inserted: totalInserted,
  };
}

/**
 * Get top startup scores, sorted by overall_score desc.
 */
export async function getTopScores(
  limit: number = 10,
): Promise<StartupScoreCardData[]> {
  const repo = await StartupScoresRepository.create();
  return repo.listCards({ limit });
}

/**
 * Aggregate startup score stats for dashboard.
 */
export async function getStatistics(): Promise<StartupScoreStats> {
  const repo = await StartupScoresRepository.create();
  const stats = await repo.getStats();

  return {
    total: stats.total,
    averageOverallScore: stats.averageOverallScore,
    highestOverallScore: stats.highestOverallScore,
    investmentGradeCount: stats.investmentGradeCount,
    averageConfidence: stats.averageConfidence,
    averageTamScore: stats.averageTamScore,
    averageMarketTimingScore: stats.averageMarketTimingScore,
    averageCompetitionScore: stats.averageCompetitionScore,
    averageMoatScore: stats.averageMoatScore,
    averageDistributionScore: stats.averageDistributionScore,
    averageExecutionScore: stats.averageExecutionScore,
    averageCapitalEfficiencyScore: stats.averageCapitalEfficiencyScore,
  };
}

/**
 * Get startup score for one opportunity.
 */
export async function getOpportunityScore(
  opportunityId: string,
): Promise<StartupScoreRow | null> {
  const repo = await StartupScoresRepository.create();
  return repo.findByOpportunity(opportunityId);
}

/**
 * Count investment-grade opportunities.
 */
export async function getInvestmentGradeCount(): Promise<number> {
  const repo = await StartupScoresRepository.create();
  return repo.investmentGradeCount();
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
  console.info("[analytics] startup_score", JSON.stringify(payload));
}

/**
 * If overall_score >= threshold, create a "⭐ Investment Grade Startup"
 * alert for every user whose watchlist matches the opportunity.
 * Idempotent via AlertsRepository.findByWatchlistAndOpportunity.
 */
async function triggerInvestmentGradeAlertIfNeeded(
  opportunityId: string,
  overallScore: number,
  recommendation: StartupScoreInput["recommendation"],
  _opportunityTitle: string,
): Promise<void> {
  if (overallScore < INVESTMENT_GRADE_ALERT_THRESHOLD) return;

  try {
    const { MatchingService } = await import("@/services/matching/matching.service");
    const { AlertsRepository } = await import("@/lib/db/repositories/alerts.repository");
    const { EmailService } = await import("@/services/email/email.service");
    const { getSupabaseServerClient } = await import("@/lib/supabase/client");
    const { OpportunitiesRepository } = await import("@/lib/db/repositories/opportunities.repository");

    const client = await getSupabaseServerClient();
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
          `[StartupScore] Failed to queue email for user ${match.userId}:`,
          err,
        );
      }
    }
  } catch (err) {
    console.error(`[StartupScore] Failed to trigger alert:`, err);
  }
  // recommendation is used by callers that want to render different copy;
  // suppressed here to avoid an unused warning while keeping the signature.
  void recommendation;
}