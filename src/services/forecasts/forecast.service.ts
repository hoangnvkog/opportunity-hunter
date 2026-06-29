/**
 * Sprint 54: Forecast Service
 *
 * Responsibilities:
 * - Load opportunities with validation_score >= 70
 * - Call AI provider to generate forecasts
 * - Persist forecasts to database
 * - Return forecast summary
 */

import type { OpportunityInput } from "@/types/pipeline";
import type { ForecastStats, OpportunityForecastRow } from "@/types/forecast";
import { createAIProvider, getAIProviderFromEnv } from "@/lib/ai";
import { OpportunityForecastsRepository } from "@/lib/db/repositories";
import { OpportunityValidationsRepository } from "@/lib/db/repositories";
import { OpportunitiesRepository } from "@/lib/db/repositories";

export async function generateForecast(
  opportunityId: string,
  providerType?: "mock" | "openai" | "gemini",
): Promise<{ processed: number; generated: number; skipped: number; inserted: number }> {
  const forecastRepo = await OpportunityForecastsRepository.create();
  const validationRepo = await OpportunityValidationsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  const opportunity = await opportunityRepo.findById(opportunityId);
  if (!opportunity) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const validation = await validationRepo.findByOpportunityId(opportunityId);
  if (!validation) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  // Gate: only forecast when validation_score >= 70
  const score = Number(validation.validation_score);
  if (score < 70) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  const opportunityInput: OpportunityInput = {
    id: opportunityId,
    score,
    frequency: opportunity.frequency,
    severity: Number(opportunity.severity),
    buying_intent: Number(opportunity.buying_intent),
    cluster_name: opportunity.title,
    cluster_description: opportunity.description,
  };

  let provider;
  if (providerType) {
    provider = createAIProvider({ type: providerType });
  } else {
    provider = getAIProviderFromEnv();
  }

  const forecastResults = await provider.forecastOpportunities([opportunityInput]);
  const forecast = forecastResults[0];
  if (!forecast) {
    return { processed: 1, generated: 0, skipped: 0, inserted: 0 };
  }

  // Delete existing (idempotent)
  await forecastRepo.deleteByOpportunity(opportunityId);

  // Insert new forecast
  const inserted = await forecastRepo.create({
    opportunity_id: opportunityId,
    forecast_score: forecast.forecast_score,
    growth_probability: forecast.growth_probability,
    confidence: forecast.confidence,
    momentum: forecast.momentum,
    prediction_summary: forecast.prediction_summary,
  });

  return { processed: 1, generated: 1, skipped: 0, inserted: inserted ? 1 : 0 };
}

export async function generateForecastBatch(
  limit: number = 50,
  providerType?: "mock" | "openai" | "gemini",
): Promise<{ processed: number; generated: number; skipped: number; inserted: number }> {
  const forecastRepo = await OpportunityForecastsRepository.create();
  const validationRepo = await OpportunityValidationsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  // Load opportunities with validation_score >= 70
  const validations = await validationRepo.list({ minScore: 70, limit });
  if (validations.length === 0) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const validOppIds = validations.map((v) => v.opportunity_id);
  const opportunities = await opportunityRepo.findByIds(validOppIds);

  const aiInputs: OpportunityInput[] = opportunities.map((opp) => {
    const validation = validations.find((v) => v.opportunity_id === opp.id)!;
    return {
      id: opp.id,
      score: Number(validation.validation_score),
      frequency: opp.frequency,
      severity: Number(opp.severity),
      buying_intent: Number(opp.buying_intent),
      cluster_name: opp.title,
      cluster_description: opp.description,
    };
  });

  let provider;
  if (providerType) {
    provider = createAIProvider({ type: providerType });
  } else {
    provider = getAIProviderFromEnv();
  }

  const forecastResults = await provider.forecastOpportunities(aiInputs);

  let totalInserted = 0;
  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];
    const forecast = forecastResults[i];
    if (!forecast) continue;

    // Idempotent: delete existing
    await forecastRepo.deleteByOpportunity(opp.id);

    await forecastRepo.create({
      opportunity_id: opp.id,
      forecast_score: forecast.forecast_score,
      growth_probability: forecast.growth_probability,
      confidence: forecast.confidence,
      momentum: forecast.momentum,
      prediction_summary: forecast.prediction_summary,
    });
    totalInserted++;
  }

  return { processed: opportunities.length, generated: totalInserted, skipped: 0, inserted: totalInserted };
}

export async function getTopForecasts(limit: number = 10): Promise<OpportunityForecastRow[]> {
  const repo = await OpportunityForecastsRepository.create();
  return repo.listTopForecasts(limit);
}

export async function getForecastStats(): Promise<ForecastStats> {
  const repo = await OpportunityForecastsRepository.create();
  const stats = await repo.getStats();
  return {
    total: stats.total,
    averageForecastScore: stats.averageForecastScore,
    averageGrowthProbability: stats.averageGrowthProbability,
    averageConfidence: stats.averageConfidence,
    averageMomentum: stats.averageMomentum,
    topForecastScore: stats.topForecastScore,
  };
}

export async function getOpportunityForecast(
  opportunityId: string,
): Promise<OpportunityForecastRow | null> {
  const repo = await OpportunityForecastsRepository.create();
  return repo.findByOpportunity(opportunityId);
}
