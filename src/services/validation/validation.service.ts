/**
 * Sprint 52: Opportunity Validation Service
 *
 * Orchestrates AI-powered validation of opportunities.
 * Flow: Load opportunities → Send batch to AI → Receive validations → Upsert to DB
 *
 * Validation dimensions:
 * - market_demand (0-100): How big is the potential market?
 * - competition (0-100): How crowded is the market? Higher = MORE competition.
 * - monetization (0-100): How easily can this be monetized?
 * - build_difficulty (0-100): How hard is it to build? Higher = harder.
 * - validation_score (0-100): Weighted — market_demand(30%) + monetization(35%) + (100-competition)(25%) + (100-build_difficulty)(10%)
 */

import { getAIProviderFromEnv } from "@/lib/ai";
import type { OpportunityInput } from "@/types/pipeline";
import type { ValidationResult } from "@/types/validation";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { OpportunityValidationsRepository } from "@/lib/db/repositories/opportunity-validations.repository";

/**
 * Validate a batch of opportunities via AI and upsert results to DB.
 * Idempotent: skips opportunities that already have validations.
 *
 * @param opportunities - Raw opportunity inputs to validate
 * @returns Counts: processed, validated, inserted, skipped
 */
export async function validateOpportunities(
  opportunities: OpportunityInput[],
): Promise<ValidationResult> {
  if (opportunities.length === 0) {
    return { processed: 0, validated: 0, inserted: 0, skipped: 0 };
  }

  const ai = getAIProviderFromEnv();
  const validationRows = await ai.validateOpportunities(opportunities);

  if (validationRows.length === 0) {
    return { processed: opportunities.length, validated: 0, inserted: 0, skipped: 0 };
  }

  const repo = await OpportunityValidationsRepository.create();
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < validationRows.length; i++) {
    const opp = opportunities[i];
    const val = validationRows[i];
    if (!opp || !val) continue;

    try {
      await repo.upsert({
        opportunity_id: opp.id!,
        market_demand: val.market_demand.toFixed(2),
        competition: val.competition.toFixed(2),
        monetization: val.monetization.toFixed(2),
        build_difficulty: val.build_difficulty.toFixed(2),
        validation_score: val.validation_score.toFixed(2),
        reasoning: val.reasoning,
      });
      inserted++;
    } catch (error) {
      console.error(`Failed to upsert validation for ${opp.id}:`, error);
      skipped++;
    }
  }

  return {
    processed: opportunities.length,
    validated: validationRows.length,
    inserted,
    skipped: skipped + (opportunities.length - validationRows.length),
  };
}

/**
 * Validate opportunities loaded from the database.
 * Skips opportunities that already have a validation record.
 *
 * @param limit - Maximum number of opportunities to process (default: 50)
 * @returns Counts: processed, validated, inserted, skipped
 */
export async function validateOpportunitiesFromDatabase(
  limit: number = 50,
): Promise<ValidationResult> {
  const oppRepo = await OpportunitiesRepository.create();
  const valRepo = await OpportunityValidationsRepository.create();

  const [opportunities, validatedIds] = await Promise.all([
    oppRepo.list({ limit: limit + 500 }),
    valRepo.listValidatedIds(limit + 500),
  ]);

  if (opportunities.length === 0) {
    return { processed: 0, validated: 0, inserted: 0, skipped: 0 };
  }

  const validatedSet = new Set(validatedIds);
  const toValidate = opportunities
    .filter((o) => !validatedSet.has(o.id))
    .slice(0, limit);

  if (toValidate.length === 0) {
    return {
      processed: 0,
      validated: 0,
      inserted: 0,
      skipped: opportunities.length,
    };
  }

  // Map to OpportunityInput shape expected by AI provider
  const inputs: OpportunityInput[] = toValidate.map((o) => ({
    id: o.id,
    score: parseFloat(o.score),
    frequency: o.frequency,
    severity: parseFloat(o.severity ?? "0.5"),
    buying_intent: parseFloat(o.buying_intent ?? "0.5"),
    cluster_name: o.title,
    cluster_description: o.description,
  }));

  return validateOpportunities(inputs);
}