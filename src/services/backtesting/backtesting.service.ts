/**
 * Sprint 59: Opportunity Backtesting Engine Service
 *
 * Responsibilities:
 * - evaluateOpportunity(): create a backtest record for a single opportunity
 * - evaluateBatch(): evaluate multiple opportunities in batch
 * - calculateAccuracy(): compute accuracy from predicted vs actual score
 * - calculatePredictionDelta(): compute delta (predicted - actual)
 * - getStatistics(): aggregate backtest stats for dashboard
 *
 * Architecture:
 * - Service orchestrates AI provider + repository + analytics + alerts
 * - AI returns business data only (no UUIDs, no FKs)
 * - Repository owns persistence
 */

import type {
  BacktestCard,
  BacktestInput,
  BacktestSearchFilters,
  BacktestStats,
} from "@/types/backtesting";
import { createAIProvider, getAIProviderFromEnv } from "@/lib/ai";
import { OpportunityBacktestsRepository } from "@/lib/db/repositories/opportunity-backtests.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { StartupScoresRepository } from "@/lib/db/repositories/startup-scores.repository";
import { MarketIntelligenceRepository } from "@/lib/db/repositories/market-intelligence.repository";
import { OpportunityForecastsRepository } from "@/lib/db/repositories/opportunity-forecasts.repository";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const EVALUATION_WINDOW_DAYS = 30; // evaluate predictions ~30 days after creation

export type AIProviderType = "mock" | "openai" | "gemini";

function buildProvider(providerType?: AIProviderType) {
  return providerType
    ? createAIProvider({ type: providerType })
    : getAIProviderFromEnv();
}

// ---------------------------------------------------------------------------
// Core evaluation
// ---------------------------------------------------------------------------

/**
 * Create a pending backtest record for an opportunity.
 * Call evaluateBacktest() later to complete the evaluation.
 *
 * Uses the startup_score predicted_score as the baseline prediction.
 */
export async function evaluateOpportunity(
  opportunityId: string,
  providerType?: AIProviderType,
): Promise<{ processed: number; inserted: number; skipped: number }> {
  const backtestsRepo = await OpportunityBacktestsRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  const opportunity = await opportunityRepo.findById(opportunityId);
  if (!opportunity) {
    return { processed: 0, inserted: 0, skipped: 0 };
  }

  const score = await scoresRepo.findByOpportunity(opportunityId);
  if (!score) {
    return { processed: 1, inserted: 0, skipped: 1 };
  }

  // Determine prediction direction from forecast if available
  const forecastsRepo = await OpportunityForecastsRepository.create();
  const forecast = await forecastsRepo.findByOpportunity(opportunityId);
  const predictedDirection = forecast
    ? (Number(forecast.forecast_score) >= Number(score.overall_score)
        ? "up"
        : "down")
    : "stable";

  const evaluationDate = new Date();
  evaluationDate.setDate(evaluationDate.getDate() + EVALUATION_WINDOW_DAYS);
  const evalDateStr = evaluationDate.toISOString().split("T")[0];

  try {
    await backtestsRepo.create({
      opportunity_id: opportunityId,
      predicted_score: String(score.overall_score),
      predicted_direction: predictedDirection,
      status: "pending",
      evaluation_date: evalDateStr,
    });
  } catch {
    // Already exists — idempotent
    return { processed: 1, inserted: 0, skipped: 1 };
  }

  return { processed: 1, inserted: 1, skipped: 0 };
}

/**
 * Complete evaluation for a single backtest record.
 * Uses AI to assess predicted vs actual performance.
 */
export async function evaluateBacktest(
  backtestId: string,
  providerType?: AIProviderType,
): Promise<{ updated: number; skipped: number }> {
  const backtestsRepo = await OpportunityBacktestsRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const intelRepo = await MarketIntelligenceRepository.create();

  const backtest = await backtestsRepo.findById(backtestId);
  if (!backtest) {
    return { updated: 0, skipped: 0 };
  }
  if (backtest.status === "evaluated") {
    return { updated: 0, skipped: 1 };
  }

  const { OpportunitiesRepository } = await import("@/lib/db/repositories/opportunities.repository");
  const oppRepo = await OpportunitiesRepository.create();
  const opportunity = await oppRepo.findById(backtest.opportunity_id);
  if (!opportunity) {
    await backtestsRepo.update(backtestId, { status: "failed" });
    return { updated: 1, skipped: 0 };
  }

  const score = await scoresRepo.findByOpportunity(backtest.opportunity_id);
  const intelligence = await intelRepo.findByOpportunity(backtest.opportunity_id);

  const marketGrowth = intelligence?.overall_score != null
    ? Number(intelligence.overall_score) - Number(opportunity.score)
    : null;
  const searchGrowth = intelligence?.google_trends_score != null
    ? Number(intelligence.google_trends_score)
    : null;
  const redditGrowth = intelligence?.reddit_score != null
    ? Number(intelligence.reddit_score)
    : null;
  const githubGrowth = intelligence?.github_score != null
    ? Number(intelligence.github_score)
    : null;
  const competitorGrowth = intelligence?.product_hunt_score != null
    ? Number(intelligence.product_hunt_score)
    : null;

  const input: BacktestInput = {
    opportunity_id: backtest.opportunity_id,
    predicted_score: Number(backtest.predicted_score),
    predicted_direction: backtest.predicted_direction ?? "stable",
    days_elapsed: 30,
    market_growth: marketGrowth,
    search_growth: searchGrowth,
    reddit_growth: redditGrowth,
    github_growth: githubGrowth,
    competitor_growth: competitorGrowth,
    current_score: Number(opportunity.score),
    score_trend: score
      ? Number(score.overall_score) - Number(backtest.predicted_score)
      : 0,
  };

  const provider = buildProvider(providerType);
  const [evaluation] = await provider.evaluateBacktest([input]);

  if (!evaluation) {
    await backtestsRepo.update(backtestId, { status: "failed" });
    return { updated: 1, skipped: 0 };
  }

  const updated = await backtestsRepo.update(backtestId, {
    actual_score: String(Math.round(evaluation.actual_score * 100) / 100),
    prediction_delta: String(
      Math.round(evaluation.prediction_delta * 100) / 100,
    ),
    market_growth: marketGrowth != null ? String(marketGrowth) : null,
    search_growth: searchGrowth != null ? String(searchGrowth) : null,
    reddit_growth: redditGrowth != null ? String(redditGrowth) : null,
    github_growth: githubGrowth != null ? String(githubGrowth) : null,
    competitor_growth: competitorGrowth != null ? String(competitorGrowth) : null,
    accuracy: String(Math.round(evaluation.accuracy * 100) / 100),
    status: "evaluated",
    notes: evaluation.notes,
  });

  emitAnalytics({
    event: "accuracy_updated",
    backtestId,
    accuracy: evaluation.accuracy,
  });

  if (evaluation.accuracy >= 60) {
    emitAnalytics({ event: "prediction_correct", backtestId });
  } else if (evaluation.accuracy < 40) {
    emitAnalytics({ event: "prediction_failed", backtestId });
  }

  await triggerModelDegradationAlertIfNeeded(
    backtest.opportunity_id,
    evaluation.accuracy,
  );

  return { updated: 1, skipped: 0 };
}

/**
 * Evaluate all pending backtest records in batch.
 */
export async function evaluateBatch(
  limit: number = 50,
  providerType?: AIProviderType,
  const backtestsRepo = await OpportunityBacktestsRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const intelRepo = await MarketIntelligenceRepository.create();
  const oppRepo = await OpportunitiesRepository.create();

  const pending = await backtestsRepo.findPending(limit);
  if (pending.length === 0) {
    return { processed: 0, evaluated: 0, skipped: 0, inserted: 0, updated: 0 };
  }

  // Build AI inputs for all pending backtests
  const inputs: BacktestInput[] = [];
  const backtestIds: string[] = [];

  for (const bt of pending) {
    const opportunity = await oppRepo.findById(bt.opportunity_id);
    if (!opportunity) continue;

    const score = await scoresRepo.findByOpportunity(bt.opportunity_id);
    const intelligence = await intelRepo.findByOpportunity(bt.opportunity_id);

    const marketGrowth = intelligence?.overall_score != null
      ? Number(intelligence.overall_score) - Number(opportunity.score)
      : null;
    const searchGrowth = intelligence?.google_trends_score != null
      ? Number(intelligence.google_trends_score)
      : null;
    const redditGrowth = intelligence?.reddit_score != null
      ? Number(intelligence.reddit_score)
      : null;
    const githubGrowth = intelligence?.github_score != null
      ? Number(intelligence.github_score)
      : null;
    const competitorGrowth = intelligence?.product_hunt_score != null
      ? Number(intelligence.product_hunt_score)
      : null;

    inputs.push({
      opportunity_id: bt.opportunity_id,
      predicted_score: Number(bt.predicted_score),
      predicted_direction: bt.predicted_direction ?? "stable",
      days_elapsed: 30,
      market_growth: marketGrowth,
      search_growth: searchGrowth,
      reddit_growth: redditGrowth,
      github_growth: githubGrowth,
      competitor_growth: competitorGrowth,
      current_score: Number(opportunity.score),
      score_trend: score
        ? Number(score.overall_score) - Number(bt.predicted_score)
        : 0,
    });
    backtestIds.push(bt.id);
  }

  const provider = buildProvider(providerType);
  const evaluations = await provider.evaluateBacktest(inputs);

  let updated = 0;
  let skipped = 0;
  let highConfCount = 0;
  let lowConfCount = 0;

  for (let i = 0; i < backtestIds.length; i++) {
    const btId = backtestIds[i];
    const evaluation = evaluations[i];
    if (!evaluation) {
      await backtestsRepo.update(btId, { status: "failed" });
      skipped++;
      continue;
    }

    const bt = pending.find((b) => b.id === btId);
    const intelligence = await intelRepo.findByOpportunity(bt?.opportunity_id ?? "");

    await backtestsRepo.update(btId, {
      actual_score: String(Math.round(evaluation.actual_score * 100) / 100),
      prediction_delta: String(
        Math.round(evaluation.prediction_delta * 100) / 100,
      ),
      market_growth: intelligence?.overall_score != null
        ? String(Number(intelligence.overall_score) - (bt ? Number((await oppRepo.findById(bt.opportunity_id))?.score ?? 0) : 0))
        : null,
      search_growth: intelligence?.google_trends_score != null
        ? String(intelligence.google_trends_score)
        : null,
      reddit_growth: intelligence?.reddit_score != null
        ? String(intelligence.reddit_score)
        : null,
      github_growth: intelligence?.github_score != null
        ? String(intelligence.github_score)
        : null,
      competitor_growth: intelligence?.product_hunt_score != null
        ? String(intelligence.product_hunt_score)
        : null,
      accuracy: String(Math.round(evaluation.accuracy * 100) / 100),
      status: "evaluated",
      notes: evaluation.notes,
    });

    updated++;
    if (evaluation.accuracy >= 60) highConfCount++;
    if (evaluation.accuracy < 40) lowConfCount++;

    emitAnalytics({
      event: "accuracy_updated",
      backtestId: btId,
      accuracy: evaluation.accuracy,
    });
    if (evaluation.accuracy >= 60) {
      emitAnalytics({ event: "prediction_correct", backtestId: btId });
    }
    if (evaluation.accuracy < 40) {
      emitAnalytics({ event: "prediction_failed", backtestId: btId });
      await triggerModelDegradationAlertIfNeeded(
        bt?.opportunity_id ?? "",
        evaluation.accuracy,
      );
    }
  }

  emitAnalytics({ event: "backtest_generated", count: updated });

  return {
    processed: pending.length,
    evaluated: updated,
    skipped,
    inserted: 0,
    updated,
  };
}

/**
 * Calculate accuracy score from predicted vs actual.
 * Scale: delta=0 → 100, delta=50 → 0.
 */
export function calculateAccuracy(
  predictedScore: number,
  actualScore: number,
): number {
  const delta = Math.abs(predictedScore - actualScore);
  return Math.max(0, Math.min(100, 100 - delta * 2));
}

/**
 * Calculate prediction delta (predicted - actual).
 * Positive = overestimated, Negative = underestimated.
 */
export function calculatePredictionDelta(
  predictedScore: number,
  actualScore: number,
): number {
  return Math.round((predictedScore - actualScore) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get aggregated statistics for the backtesting dashboard.
 */
export async function getStatistics(): Promise<BacktestStats> {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.getStats();
}

/**
 * List backtest card data with opportunity context.
 */
export async function listBacktests(
  filters: BacktestSearchFilters = {},
): Promise<BacktestCard[]> {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.listCards(filters);
}

/**
 * Get backtest by ID.
 */
export async function getBacktestById(
  id: string,
): Promise<ReturnType<typeof OpportunityBacktestsRepository.prototype.findById>> {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.findById(id);
}

/**
 * Get backtests for a specific opportunity.
 */
export async function getOpportunityBacktests(
  opportunityId: string,
  limit = 20,
) {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.findByOpportunity(opportunityId, limit);
}

/**
 * Get accuracy distribution for admin dashboard.
 */
export async function getAccuracyDistribution() {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.getAccuracyDistribution();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emitAnalytics(payload: Record<string, unknown>): void {
  console.info("[analytics] backtesting", JSON.stringify(payload));
}

async function triggerModelDegradationAlertIfNeeded(
  opportunityId: string,
  accuracy: number,
): Promise<void> {
  // Trigger high-confidence alert when accuracy > 90
  if (accuracy > 90) {
    console.info(
      `[backtesting] High confidence model alert: accuracy=${accuracy} for opportunity=${opportunityId}`,
    );
    return;
  }

  // Trigger model degradation alert when accuracy < 40
  if (accuracy < 40) {
    console.warn(
      `[backtesting] Model degradation alert: accuracy=${accuracy} for opportunity=${opportunityId}`,
    );
    return;
  }
}