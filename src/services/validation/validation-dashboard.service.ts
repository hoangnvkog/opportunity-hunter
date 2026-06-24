import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { OpportunityValidationsRepository } from "@/lib/db/repositories/opportunity-validations.repository";

export interface ValidatedOpportunity {
  id: string;
  cluster_name: string;
  cluster_description: string;
  validation_score: number;
  market_demand: number;
  pain_severity: number;
  buying_intent: number;
  competition_risk: number;
}

/**
 * Get all validated opportunities with their details.
 */
export async function getValidatedOpportunities(): Promise<ValidatedOpportunity[]> {
  const [oppRepo, valRepo] = await Promise.all([
    OpportunitiesRepository.create(),
    OpportunityValidationsRepository.create(),
  ]);

  // Get top validations (score >= 70)
  const validations = await valRepo.list({ limit: 100, minScore: 70 });

  if (validations.length === 0) {
    return [];
  }

  // Get opportunity details for each validation
  const opportunityIds = validations.map((v) => v.opportunity_id);
  const opportunities = await oppRepo.findByIds(opportunityIds);

  // Create a map for quick lookup
  const oppMap = new Map(opportunities.map((o) => [o.id, o]));

  // Combine validation and opportunity data
  return validations.map((val) => {
    const opp = oppMap.get(val.opportunity_id);
    if (!opp) {
      console.warn(`Opportunity ${val.opportunity_id} not found for validation ${val.id}`);
      return null;
    }

    return {
      id: val.opportunity_id,
      cluster_name: opp.title,
      cluster_description: opp.description,
      validation_score: parseFloat(val.validation_score),
      market_demand: parseFloat(val.market_demand),
      pain_severity: parseFloat(val.pain_severity),
      buying_intent: parseFloat(val.buying_intent),
      competition_risk: parseFloat(val.competition_risk),
    };
  }).filter(Boolean) as ValidatedOpportunity[];
}