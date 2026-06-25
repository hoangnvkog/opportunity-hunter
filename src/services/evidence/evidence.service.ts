/**
 * Sprint 53: Market Evidence Service
 *
 * Responsibilities:
 * - Load opportunities with validation scores >= 70
 * - Call AI provider to generate market evidence
 * - Persist evidence to database
 * - Return evidence summary
 */

import type { OpportunityInput } from "@/types/pipeline";
import type { EvidenceInput, EvidenceGenerationResult, EvidenceStats, OpportunityEvidenceRow } from "@/types/evidence";
import { createAIProvider, getAIProviderFromEnv } from "@/lib/ai";
import { OpportunityEvidenceRepository } from "@/lib/db/repositories";
import { OpportunityValidationsRepository } from "@/lib/db/repositories";
import { OpportunitiesRepository } from "@/lib/db/repositories";

export async function generateEvidenceForOpportunity(
  opportunityId: string,
  providerType?: "mock" | "openai" | "gemini",
): Promise<EvidenceGenerationResult> {
  const evidenceRepo = await OpportunityEvidenceRepository.create();
  const validationRepo = await OpportunityValidationsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  // Load opportunity with validation score
  const opportunity = await opportunityRepo.findById(opportunityId);
  if (!opportunity) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const validation = await validationRepo.findByOpportunityId(opportunityId);
  if (!validation) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  // Gate: only generate evidence for validation_score >= 70
  const score = Number(validation.validation_score);
  if (score < 70) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  // Build opportunity input for AI (map DB fields to pipeline input)
  const opportunityInput: OpportunityInput = {
    id: opportunityId,
    score,
    frequency: opportunity.frequency,
    severity: Number(opportunity.severity),
    buying_intent: Number(opportunity.buying_intent),
    cluster_name: opportunity.title, // DB: title → AI: cluster_name
    cluster_description: opportunity.description, // DB: description → AI: cluster_description
  };

  // Get AI provider
  let provider;
  if (providerType) {
    provider = createAIProvider({ type: providerType });
  } else {
    provider = getAIProviderFromEnv();
  }

  // Generate evidence (batch of 1)
  const evidenceResults = await provider.findMarketEvidence([opportunityInput]);
  const evidenceItems = evidenceResults[0] ?? [];

  // Delete existing evidence (idempotent)
  await evidenceRepo.deleteByOpportunity(opportunityId);

  // Insert new evidence
  const insertRecords = evidenceItems.map((ev: EvidenceInput) => ({
    opportunity_id: opportunityId,
    evidence_type: ev.evidence_type,
    source: ev.source,
    title: ev.title,
    url: ev.url,
    summary: ev.summary,
    confidence: Math.round(ev.confidence * 100) / 100,
  }));

  const inserted = await evidenceRepo.createMany(insertRecords);

  return {
    processed: 1,
    generated: evidenceItems.length,
    skipped: 0,
    inserted: inserted.length,
  };
}

export async function generateEvidenceBatch(
  limit: number = 50,
  providerType?: "mock" | "openai" | "gemini",
): Promise<EvidenceGenerationResult> {
  const evidenceRepo = await OpportunityEvidenceRepository.create();
  const validationRepo = await OpportunityValidationsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  // Load opportunities with validation_score >= 70
  const validations = await validationRepo.list({ minScore: 70, limit });

  if (validations.length === 0) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  // Get opportunity IDs
  const validOppIds = validations.map((v) => v.opportunity_id);

  // Load opportunities from DB
  const opportunities = await opportunityRepo.findByIds(validOppIds);

  // Build AI inputs
  const aiInputs: OpportunityInput[] = opportunities.map((opp) => {
    const validation = validations.find((v) => v.opportunity_id === opp.id)!;
    return {
      id: opp.id,
      score: Number(validation.validation_score),
      frequency: opp.frequency,
      severity: Number(opp.severity),
      buying_intent: Number(opp.buying_intent),
      cluster_name: opp.title, // DB: title → AI: cluster_name
      cluster_description: opp.description, // DB: description → AI: cluster_description
    };
  });

  // Get AI provider
  let provider;
  if (providerType) {
    provider = createAIProvider({ type: providerType });
  } else {
    provider = getAIProviderFromEnv();
  }

  // Generate evidence in batch
  const evidenceResults = await provider.findMarketEvidence(aiInputs);

  let totalInserted = 0;
  let totalGenerated = 0;

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];
    const evidenceItems = evidenceResults[i] ?? [];

    if (evidenceItems.length === 0) continue;

    totalGenerated += evidenceItems.length;

    // Delete existing evidence for this opportunity (idempotent)
    await evidenceRepo.deleteByOpportunity(opp.id);

    // Insert new evidence
    const insertRecords = evidenceItems.map((ev: EvidenceInput) => ({
      opportunity_id: opp.id,
      evidence_type: ev.evidence_type,
      source: ev.source,
      title: ev.title,
      url: ev.url,
      summary: ev.summary,
      confidence: Math.round(ev.confidence * 100) / 100,
    }));

    const inserted = await evidenceRepo.createMany(insertRecords);
    totalInserted += inserted.length;
  }

  return {
    processed: opportunities.length,
    generated: totalGenerated,
    skipped: 0,
    inserted: totalInserted,
  };
}

export async function regenerateEvidence(
  opportunityId: string,
  providerType?: "mock" | "openai" | "gemini",
): Promise<EvidenceGenerationResult> {
  // Delete existing + regenerate (idempotent)
  const evidenceRepo = await OpportunityEvidenceRepository.create();
  await evidenceRepo.deleteByOpportunity(opportunityId);
  return generateEvidenceForOpportunity(opportunityId, providerType);
}

export async function getOpportunityEvidence(
  opportunityId: string,
): Promise<OpportunityEvidenceRow[]> {
  const repository = await OpportunityEvidenceRepository.create();
  return repository.listByOpportunity(opportunityId);
}

export async function getEvidenceStats(): Promise<EvidenceStats> {
  const repository = await OpportunityEvidenceRepository.create();

  const total = await repository.count();
  const avgConfidence = await repository.averageConfidence();
  const oppWithEvidence = await repository.countOpportunitiesWithEvidence();

  // Count by type
  const allEvidence = await repository.list({ limit: 1000 });
  const byType: Record<string, number> = {
    reddit: 0,
    google_trend: 0,
    competitor: 0,
    market_report: 0,
    pricing: 0,
    customer_quote: 0,
  };

  for (const ev of allEvidence) {
    byType[ev.evidence_type] = (byType[ev.evidence_type] ?? 0) + 1;
  }

  return {
    total,
    byType: byType as EvidenceStats["byType"],
    averageConfidence: avgConfidence,
    evidencePerOpportunity: oppWithEvidence > 0 ? Math.round((total / oppWithEvidence) * 100) / 100 : 0,
  };
}

/**
 * Group evidence by type for display
 */
export function groupEvidenceByType(
  evidence: OpportunityEvidenceRow[],
): Record<string, OpportunityEvidenceRow[]> {
  const grouped: Record<string, OpportunityEvidenceRow[]> = {};

  for (const ev of evidence) {
    if (!grouped[ev.evidence_type]) {
      grouped[ev.evidence_type] = [];
    }
    grouped[ev.evidence_type].push(ev);
  }

  return grouped;
}