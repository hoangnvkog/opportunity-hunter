/**
 * Sprint 59: Opportunity Backtesting Engine Service
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

export type AIProviderType = "mock" | "openai" | "gemini";

function buildProvider(providerType?: AIProviderType) {
  return providerType
    ? createAIProvider({ type: providerType })
    : getAIProviderFromEnv();
}

export async function evaluateOpportunity(
  opportunityId: string,
  providerType?: AIProviderType,
): Promise<{ processed: number; inserted: number; skipped: number }> {
  const backtestsRepo = await OpportunityBacktestsRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  const opportunity = await opportunityRepo.findById(opportunityId);
  if (!opportunity) return { processed: 0, inserted: 0, skipped: 0 };

  const score = await scoresRepo.findByOpportunity(opportunityId);
  if (!score) return { processed: 1, inserted: 0, skipped: 1 };

  try {
    await backtestsRepo.create({
      opportunity_id: opportunityId,
      predicted_score: String(score.overall_score),
      predicted_direction: "stable",
      status: "pending",
      evaluation_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
  } catch {
    return { processed: 1, inserted: 0, skipped: 1 };
  }

  return { processed: 1, inserted: 1, skipped: 0 };
}

export async function evaluateBacktest(
  backtestId: string,
  providerType?: AIProviderType,
): Promise<{ updated: number; skipped: number }> {
  const backtestsRepo = await OpportunityBacktestsRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const intelRepo = await MarketIntelligenceRepository.create();
  const oppRepo = await OpportunitiesRepository.create();

  const backtest = await backtestsRepo.findById(backtestId);
  if (!backtest) return { updated: 0, skipped: 1 };
  if (backtest.status === "evaluated") return { updated: 0, skipped: 1 };

  const opportunity = await oppRepo.findById(backtest.opportunity_id);
  if (!opportunity) {
    await backtestsRepo.update(backtestId, { status: "failed" });
    return { updated: 0, skipped: 1 };
  }

  const score = await scoresRepo.findByOpportunity(backtest.opportunity_id);
  const intelligence = await intelRepo.findByOpportunity(backtest.opportunity_id);

  const input: BacktestInput = {
    opportunity_id: backtest.opportunity_id,
    predicted_score: Number(backtest.predicted_score),
    predicted_direction: backtest.predicted_direction ?? "stable",
    days_elapsed: 30,
    market_growth: intelligence?.overall_score != null
      ? Number(intelligence.overall_score) - Number(opportunity.score)
      : null,
    search_growth: intelligence?.google_trends_score != null
      ? Number(intelligence.google_trends_score)
      : null,
    reddit_growth: intelligence?.reddit_score != null
      ? Number(intelligence.reddit_score)
      : null,
    github_growth: intelligence?.github_score != null
      ? Number(intelligence.github_score)
      : null,
    competitor_growth: intelligence?.product_hunt_score != null
      ? Number(intelligence.product_hunt_score)
      : null,
    current_score: Number(opportunity.score),
    score_trend: score ? Number(score.overall_score) - Number(backtest.predicted_score) : 0,
  };

  const provider = buildProvider(providerType);
  const [evaluation] = await provider.evaluateBacktest([input]);

  if (!evaluation) {
    await backtestsRepo.update(backtestId, { status: "failed" });
    return { updated: 1, skipped: 0 };
  }

  await backtestsRepo.update(backtestId, {
    actual_score: String(Math.round(evaluation.actual_score * 100) / 100),
    prediction_delta: String(Math.round(evaluation.prediction_delta * 100) / 100),
    market_growth: intelligence?.overall_score != null
      ? String(Number(intelligence.overall_score) - Number(opportunity.score))
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

  console.info("[analytics] backtesting", JSON.stringify({ event: "accuracy_updated", backtestId, accuracy: evaluation.accuracy }));
  if (evaluation.accuracy >= 60) console.info("[analytics] backtesting", JSON.stringify({ event: "prediction_correct", backtestId }));
  if (evaluation.accuracy < 40) {
    console.info("[analytics] backtesting", JSON.stringify({ event: "prediction_failed", backtestId }));
    await triggerModelDegradationAlertIfNeeded(backtest.opportunity_id ?? "", evaluation.accuracy);
  }

  return { updated: 1, skipped: 0 };
}

export async function evaluateBatch(
  limit: number = 50,
  providerType?: AIProviderType,
): Promise<{ processed: number; evaluated: number; skipped: number; inserted: number; updated: number }> {
  const backtestsRepo = await OpportunityBacktestsRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const intelRepo = await MarketIntelligenceRepository.create();
  const oppRepo = await OpportunitiesRepository.create();

  const pending = await backtestsRepo.findPending(limit);
  if (pending.length === 0) return { processed: 0, evaluated: 0, skipped: 0, inserted: 0, updated: 0 };

  const inputs: BacktestInput[] = [];
  const backtestIds: string[] = [];

  for (const bt of pending) {
    const opportunity = await oppRepo.findById(bt.opportunity_id);
    if (!opportunity) continue;

    const score = await scoresRepo.findByOpportunity(bt.opportunity_id);
    const intelligence = await intelRepo.findByOpportunity(bt.opportunity_id);

    inputs.push({
      opportunity_id: bt.opportunity_id,
      predicted_score: Number(bt.predicted_score),
      predicted_direction: bt.predicted_direction ?? "stable",
      days_elapsed: 30,
      market_growth: intelligence?.overall_score != null
        ? Number(intelligence.overall_score) - Number(opportunity.score)
        : null,
      search_growth: intelligence?.google_trends_score != null
        ? Number(intelligence.google_trends_score)
        : null,
      reddit_growth: intelligence?.reddit_score != null
        ? Number(intelligence.reddit_score)
        : null,
      github_growth: intelligence?.github_score != null
        ? Number(intelligence.github_score)
        : null,
      competitor_growth: intelligence?.product_hunt_score != null
        ? Number(intelligence.product_hunt_score)
        : null,
      current_score: Number(opportunity.score),
      score_trend: score ? Number(score.overall_score) - Number(bt.predicted_score) : 0,
    });
    backtestIds.push(bt.id);
  }

  const provider = buildProvider(providerType);
  const evaluations = await provider.evaluateBacktest(inputs);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < backtestIds.length; i++) {
    const btId = backtestIds[i];
    const evaluation = evaluations[i];
    if (!evaluation) {
      await backtestsRepo.update(btId, { status: "failed" });
      ++skipped;
      continue;
    }

    const bt = pending.find((b) => b.id === btId);
    const intelligence = await intelRepo.findByOpportunity(bt?.opportunity_id ?? "");

    await backtestsRepo.update(btId, {
      actual_score: String(Math.round(evaluation.actual_score * 100) / 100),
      prediction_delta: String(Math.round(evaluation.prediction_delta * 100) / 100),
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

    ++updated;
  }

  console.info("[analytics] backtesting", JSON.stringify({ event: "backtest_generated", count: updated }));

  return { processed: pending.length, evaluated: updated, skipped, inserted: 0, updated };
}

export function calculateAccuracy(predicted_score: number, actual_score: number): number {
  const rawDelta = predicted_score - actual_score;
  const absDelta = Math.abs(rawDelta);
  return Math.max(0, Math.min(100, 100 - absDelta * 2));
}

export function calculatePredictionDelta(predicted_score: number, actual_score: number): number {
  return Math.round((predicted_score - actual_score) * 100) / 100;
}

function emitAnalytics(payload: Record<string, unknown>): void {
  console.info("[analytics] backtesting", JSON.stringify(payload));
}

async function triggerModelDegradationAlertIfNeeded(
  opportunityId: string,
  accuracy: number,
): Promise<void> {
  if (accuracy > 90) {
    console.info(`[backtesting] High confidence model alert: accuracy=${accuracy} for opportunity=${opportunityId}`);
    return;
  }
  if (accuracy < 40) {
    console.warn(`[backtesting] Model degradation alert: accuracy=${accuracy} for opportunity=${opportunityId}`);
  }
}

export async function getStatistics(): Promise<BacktestStats> {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.getStats();
}

export async function listBacktests(
  filters: BacktestSearchFilters = {},
): Promise<BacktestCard[]> {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.listCards(filters);
}

export async function getBacktestById(id: string) {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.findById(id);
}

export async function getOpportunityBacktests(opportunityId: string, limit = 20) {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.findByOpportunity(opportunityId, limit);
}

export async function getAccuracyDistribution() {
  const repo = await OpportunityBacktestsRepository.create();
  return repo.getAccuracyDistribution();
}
