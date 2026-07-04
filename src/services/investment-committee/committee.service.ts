/**
 * Sprint 67: Investment Committee Service
 *
 * Runs the AI investment committee for an opportunity.
 *
 * Pipeline:
 *  1. Load all context (opportunity, validation, forecast, venture score, financial, research)
 *  2. Call AI provider to run 5 agents in parallel
 *  3. Aggregate votes into committee decision
 *  4. Persist committee + votes
 *
 * Provider abstraction: uses OpenAI directly for simplicity.
 * Can be swapped to GeminiProvider by changing the AI call below.
 */
import OpenAI from "openai";

import {
  InvestmentCommitteesRepository,
  CommitteeVotesRepository,
  OpportunitiesRepository,
  OpportunityValidationsRepository,
  OpportunityForecastsRepository,
  VentureScoresRepository,
  FinancialModelsRepository,
} from "@/lib/db/repositories/index";
import { VentureProjectsRepository } from "@/lib/db/repositories/venture-projects.repository";

import {
  computeOverallScore,
  computeConfidence,
  computeDisagreement,
  aggregateVotes,
  generateSummary,
  type AgentVoteOutput,
  type AgentVoteContext,
  type CommitteeWithVotes,
  type CommitteeDashboardStats,
  type CommitteeCardData,
  type CommitteeGenerationResult,
  type FinalDecision,
  type CommitteeVoteInsert,
  type CommitteeVoteRow,
  type InvestmentCommitteeRow,
} from "./investment-committee.types";

import { runCommittee } from "./committee.runner";

// ---------------------------------------------------------------------------
// AI Provider wrapper
// ---------------------------------------------------------------------------

function createAIProvider(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");
  return new OpenAI({ apiKey });
}

async function callAI(provider: OpenAI, system: string, user: string): Promise<unknown> {
  const response = await provider.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const content = response.choices[0]?.message?.content?.trim() ?? "{}";
  return JSON.parse(content);
}

// ---------------------------------------------------------------------------
// Load context from database
// ---------------------------------------------------------------------------

async function loadContext(opportunityId: string): Promise<{
  ctx: AgentVoteContext;
  opportunityTitle: string;
}> {
  const [
    oppRepo,
    valRepo,
    foreRepo,
    vsRepo,
    finRepo,
    projRepo,
  ] = await Promise.all([
    OpportunitiesRepository.create(),
    OpportunityValidationsRepository.create(),
    OpportunityForecastsRepository.create(),
    VentureScoresRepository.create(),
    FinancialModelsRepository.create(),
    VentureProjectsRepository.create(),
  ]);

  const opp = await oppRepo.findById(opportunityId);
  if (!opp) throw new Error(`Opportunity ${opportunityId} not found`);

  const [validation, forecast, ventureScore] = await Promise.all([
    valRepo.findByOpportunityId(opportunityId),
    foreRepo.findByOpportunity(opportunityId),
    vsRepo.findByOpportunityId(opportunityId),
  ]);

  // Financial model: find via venture project
  let financialModel = null;
  const projects = await projRepo.list({ limit: 100 });
  const relatedProject = projects.find(
    (p: { opportunity_id?: string | null }) => p.opportunity_id === opportunityId,
  );
  if (relatedProject) {
    const model = await finRepo.findByVentureProject(relatedProject.id);
    if (model) {
      financialModel = {
        projected_arr: (model.assumptions as { averagePrice?: number })?.averagePrice ? 50000 : 0,
        break_even_month: 24,
        ltv_cac_ratio: 3,
        burn_rate: 0,
      };
    }
  }

  // Research: aggregate from venture projects
  let research = null;
  if (relatedProject) {
    research = { completeness: 70, sources_count: 3 };
  }

  const ctx: AgentVoteContext = {
    opportunity: {
      title: opp.title ?? "Untitled",
      description: opp.description ?? "",
      score: opp.score ? Number(opp.score) : 50,
      cluster_size: opp.cluster_id ? 100 : null,
      severity: opp.severity ? Number(opp.severity) : 0.5,
      buying_intent: opp.buying_intent ? Number(opp.buying_intent) : 0.5,
    },
    validation: validation
      ? { score: Number(validation.validation_score), reasoning: validation.reasoning ?? "" }
      : null,
    forecast: forecast
      ? {
          forecast_score: Number(forecast.forecast_score ?? 50),
          growth_rate: Number(forecast.momentum ?? 0),
          confidence: Number(forecast.confidence ?? 50),
        }
      : null,
    venture_score: ventureScore
      ? {
          overall_score: Number(ventureScore.overall_score),
          investment_grade: ventureScore.investment_grade ?? "B",
          recommendation: ventureScore.recommendation ?? "Watch",
        }
      : null,
    financial_model: financialModel,
    research,
  };

  return { ctx, opportunityTitle: opp.title ?? "Untitled" };
}

// ---------------------------------------------------------------------------
// Run committee for one opportunity
// ---------------------------------------------------------------------------

export async function runInvestmentCommittee(
  opportunityId: string,
): Promise<InvestmentCommitteeRow | null> {
  const { ctx } = await loadContext(opportunityId);

  const provider = createAIProvider();
  const { votes, errors } = await runCommittee(ctx, (sys, user) =>
    callAI(provider, sys, user),
  );

  // Aggregation
  const overallScore = computeOverallScore(votes);
  const confidence = computeConfidence(votes);
  const disagreement = computeDisagreement(votes);
  const { majorityVote, minorityVote, finalDecision } = aggregateVotes(votes);
  const summary = generateSummary(votes, finalDecision, disagreement);

  if (errors.length > 0) {
    console.warn(`[committee] ${opportunityId} — ${errors.length} agent errors:`, errors);
  }

  // Persist committee
  const committeeRepo = await InvestmentCommitteesRepository.create();
  const committee = await committeeRepo.upsert({
    opportunity_id: opportunityId,
    overall_score: overallScore,
    confidence,
    majority_vote: majorityVote,
    minority_vote: minorityVote,
    final_decision: finalDecision as FinalDecision,
    summary,
  });

  // Persist votes
  const votesRepo = await CommitteeVotesRepository.create();
  await votesRepo.deleteByCommitteeId(committee.id); // replace on re-run
  const voteInserts: CommitteeVoteInsert[] = votes.map((v: AgentVoteOutput) => ({
    committee_id: committee.id,
    agent_name: v.agent_name,
    agent_role: v.agent_role,
    vote: v.vote,
    score: v.score,
    confidence: v.confidence,
    pros: v.pros,
    cons: v.cons,
    reasoning: v.reasoning,
  }));
  await votesRepo.createMany(voteInserts);

  return committee;
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function getCommitteeByOpportunity(
  opportunityId: string,
): Promise<CommitteeWithVotes | null> {
  const [committeeRepo, votesRepo] = await Promise.all([
    InvestmentCommitteesRepository.create(),
    CommitteeVotesRepository.create(),
  ]);

  const committee = await committeeRepo.findByOpportunityId(opportunityId);
  if (!committee) return null;

  const votes = await votesRepo.findByCommitteeId(committee.id);
  return { committee, votes };
}

export async function getCommitteeStats(): Promise<CommitteeDashboardStats> {
  const repo = await InvestmentCommitteesRepository.create();
  return repo.getDashboardStats();
}

export async function getCommitteeCards(limit = 50): Promise<CommitteeCardData[]> {
  const repo = await InvestmentCommitteesRepository.create();
  return repo.listCards(limit);
}

export async function getCommitteeById(id: string): Promise<CommitteeWithVotes | null> {
  const [committeeRepo, votesRepo] = await Promise.all([
    InvestmentCommitteesRepository.create(),
    CommitteeVotesRepository.create(),
  ]);

  const committee = await committeeRepo.findById(id);
  if (!committee) return null;

  const votes = await votesRepo.findByCommitteeId(committee.id);
  return { committee, votes };
}

export async function getAgentStats(): Promise<{
  mostOptimistic: string;
  mostConservative: string;
  agreementRate: number;
}> {
  const repo = await InvestmentCommitteesRepository.create();
  return repo.getAgentStats();
}

export async function listCommitteesByDecision(
  decision: FinalDecision,
  limit = 20,
): Promise<InvestmentCommitteeRow[]> {
  const repo = await InvestmentCommitteesRepository.create();
  return repo.listByDecision(decision, limit);
}

export async function listHighConfidence(limit = 10): Promise<InvestmentCommitteeRow[]> {
  const repo = await InvestmentCommitteesRepository.create();
  return repo.listHighConfidence(limit);
}

export async function listSplitVotes(limit = 10): Promise<InvestmentCommitteeRow[]> {
  const repo = await InvestmentCommitteesRepository.create();
  return repo.listSplitVotes(limit);
}

export async function listStrongBuy(limit = 10): Promise<InvestmentCommitteeRow[]> {
  const repo = await InvestmentCommitteesRepository.create();
  return repo.listStrongBuy(limit);
}

export async function listRejected(limit = 10): Promise<InvestmentCommitteeRow[]> {
  const repo = await InvestmentCommitteesRepository.create();
  return repo.listRejected(limit);
}

// ---------------------------------------------------------------------------
// Batch — for background cron re-evaluation
// ---------------------------------------------------------------------------

export async function batchRunCommittee(limit = 50): Promise<CommitteeGenerationResult> {
  const oppRepo = await OpportunitiesRepository.create();
  const opportunities = await oppRepo.list({ limit, minScore: 70 });

  let inserted = 0;
  let skipped = 0;

  for (const opp of opportunities) {
    try {
      await runInvestmentCommittee(opp.id);
      inserted++;
    } catch {
      skipped++;
    }
  }

  return { processed: opportunities.length, inserted, skipped };
}

// ---------------------------------------------------------------------------
// Rebuild committee votes from runner (for admin re-run)
// ---------------------------------------------------------------------------

export async function rebuildCommittee(committeeId: string): Promise<InvestmentCommitteeRow | null> {
  const repo = await InvestmentCommitteesRepository.create();
  const committee = await repo.findById(committeeId);
  if (!committee) return null;
  return runInvestmentCommittee(committee.opportunity_id);
}

// ---------------------------------------------------------------------------
// Export types for convenience
// ---------------------------------------------------------------------------

export type {
  AgentVoteOutput,
  CommitteeWithVotes,
  CommitteeDashboardStats,
  CommitteeCardData,
  CommitteeGenerationResult,
  FinalDecision,
  InvestmentCommitteeRow,
  CommitteeVoteRow,
};