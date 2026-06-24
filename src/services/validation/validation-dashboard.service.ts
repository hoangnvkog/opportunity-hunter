/**
 * Dashboard service for validated opportunities (Sprint 52).
 */

import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { OpportunityValidationsRepository } from "@/lib/db/repositories/opportunity-validations.repository";

export interface ValidatedOpportunity {
  id: string;
  cluster_name: string;
  cluster_description: string;
  validation_score: number;
  market_demand: number;
  competition: number;
  monetization: number;
  build_difficulty: number;
  reasoning: string | null;
}

/**
 * Get top validated opportunities (validation_score >= 70).
 */
export async function getTopValidatedOpportunities(
  limit = 20,
): Promise<ValidatedOpportunity[]> {
  const [oppRepo, valRepo] = await Promise.all([
    OpportunitiesRepository.create(),
    OpportunityValidationsRepository.create(),
  ]);

  const validations = await valRepo.list({ limit: limit * 2, minScore: 70 });

  if (validations.length === 0) return [];

  const opps = await oppRepo.findByIds(validations.map((v) => v.opportunity_id));
  const oppMap = new Map(opps.map((o) => [o.id, o]));

  return validations
    .map((val) => {
      const opp = oppMap.get(val.opportunity_id);
      if (!opp) return null;

      return {
        id: val.opportunity_id,
        cluster_name: opp.title,
        cluster_description: opp.description,
        validation_score: parseFloat(val.validation_score),
        market_demand: parseFloat(val.market_demand),
        competition: parseFloat(val.competition),
        monetization: parseFloat(val.monetization),
        build_difficulty: parseFloat(val.build_difficulty),
        reasoning: val.reasoning,
      };
    })
    .filter(Boolean) as ValidatedOpportunity[];
}