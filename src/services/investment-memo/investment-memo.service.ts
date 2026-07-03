/**
 * Sprint 58: Investment Memo Generator Service
 *
 * Responsibilities:
 * - Generate investment memos for top opportunities
 * - Only generates when startup_score overall_score >= 85
 * - Persist memo records to database (with venture_report_id + investment_score_id FKs)
 * - Trigger "💰 Investor Ready Startup" alert when recommendation == "STRONG BUY"
 * - Track analytics events: investment_memo_generated, memo_exported, memo_viewed
 *
 * Architecture:
 * - Service is the only place that orchestrates AI provider + repo + alert.
 * - AI returns business data only (no UUIDs, no FKs).
 * - Repository owns persistence and FK wiring.
 */

import type { OpportunityInput } from "@/types/pipeline";
import type {
  InvestmentMemoCardData,
  InvestmentMemoGenerationResult,
  InvestmentMemoRow,
  InvestmentMemoStats,
  InvestmentMemoSearchFilters,
  InvestmentMemoInput,
} from "@/types/investment-memo";
import { createAIProvider, getAIProviderFromEnv } from "@/lib/ai";
import { InvestmentMemosRepository } from "@/lib/db/repositories/investment-memos.repository";
import { StartupScoresRepository } from "@/lib/db/repositories/startup-scores.repository";
import { VentureReportsRepository } from "@/lib/db/repositories/venture-reports.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";

/**
 * Threshold for generating investment memos (Sprint 58 spec).
 * Only generates for opportunities with startup_score overall_score >= 85.
 */
export const INVESTMENT_MEMO_SCORE_THRESHOLD = 85;

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
 * Generate investment memo for a single opportunity (if eligible).
 *
 * Gates:
 * - startup_score overall_score >= 85
 * - venture_report must exist (memo is the final stage of investment analysis)
 */
export async function generate(
  opportunityId: string,
  providerType?: AIProviderType,
): Promise<InvestmentMemoGenerationResult> {
  const memosRepo = await InvestmentMemosRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const reportsRepo = await VentureReportsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  const opportunity = await opportunityRepo.findById(opportunityId);
  if (!opportunity) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const score = await scoresRepo.findByOpportunity(opportunityId);
  if (!score) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  if (Number(score.overall_score) < INVESTMENT_MEMO_SCORE_THRESHOLD) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  const report = await reportsRepo.findByOpportunity(opportunityId);
  if (!report) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  // Idempotent: skip if memo already exists for this opportunity.
  // Cheap DB check before invoking the AI provider.
  const existing = await memosRepo.findByOpportunity(opportunityId);
  if (existing) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  const opportunityInput = buildOpportunityInput(
    opportunityId,
    Number(score.overall_score),
    opportunity.title,
    opportunity.description,
    opportunity.frequency,
    Number(opportunity.severity ?? 0),
    Number(opportunity.buying_intent ?? 0),
  );

  const provider = buildProvider(providerType);
  const [memo] = await provider.generateInvestmentMemo([opportunityInput]);

  if (!memo) {
    return { processed: 1, generated: 0, skipped: 0, inserted: 0 };
  }

  await memosRepo.create({
    opportunity_id: opportunityId,
    venture_report_id: report.id,
    investment_score_id: score.id,
    title: memo.title,
    thesis: memo.thesis,
    market: memo.market,
    problem: memo.problem,
    solution: memo.solution,
    business_model: memo.business_model,
    traction: memo.traction,
    competition: memo.competition,
    risks: memo.risks,
    strengths: memo.strengths,
    why_now: memo.why_now,
    investment_decision: memo.investment_decision,
    recommendation: memo.recommendation,
    confidence: round2(memo.confidence),
    memo_version: 1,
  });

  emitAnalytics({
    event: "investment_memo_generated",
    opportunityId,
    confidence: memo.confidence,
    recommendation: memo.recommendation,
  });

  await triggerInvestorReadyAlertIfNeeded(
    opportunityId,
    memo.recommendation,
    memo.confidence,
    opportunity.title,
  );

  return { processed: 1, generated: 1, skipped: 0, inserted: 1 };
}

/**
 * Generate investment memos in batch for all eligible opportunities.
 *
 * Eligibility:
 * - startup_score overall_score >= 85
 * - venture_report exists
 */
export async function generateBatch(
  limit: number = 50,
  providerType?: AIProviderType,
): Promise<InvestmentMemoGenerationResult> {
  const memosRepo = await InvestmentMemosRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const reportsRepo = await VentureReportsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  // Pull score cards at threshold
  const scoreCards = await scoresRepo.listCards({
    limit,
    minScore: INVESTMENT_MEMO_SCORE_THRESHOLD,
  });
  if (scoreCards.length === 0) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  // Pull existing memos to filter idempotently
  const existingMemos = await memosRepo.list({ limit: 1000 });
  const existingMemoSet = new Set(existingMemos.map((m) => m.opportunity_id));

  const eligible: Array<{ opportunityId: string; score: number; title: string }> = [];
  const aiInputs: OpportunityInput[] = [];
  const inputsByOpportunity = new Map<string, number>(); // oppId -> index in aiInputs

  for (const card of scoreCards) {
    if (existingMemoSet.has(card.opportunity_id)) continue;

    const opportunity = await opportunityRepo.findById(card.opportunity_id);
    if (!opportunity) continue;

    const report = await reportsRepo.findByOpportunity(card.opportunity_id);
    if (!report) continue;

    inputsByOpportunity.set(card.opportunity_id, aiInputs.length);
    aiInputs.push(
      buildOpportunityInput(
        card.opportunity_id,
        card.overall_score,
        opportunity.title,
        opportunity.description,
        opportunity.frequency,
        Number(opportunity.severity ?? 0),
        Number(opportunity.buying_intent ?? 0),
      ),
    );
    eligible.push({
      opportunityId: card.opportunity_id,
      score: card.overall_score,
      title: opportunity.title,
    });
  }

  if (aiInputs.length === 0) {
    return {
      processed: scoreCards.length,
      generated: 0,
      skipped: scoreCards.length,
      inserted: 0,
    };
  }

  const provider = buildProvider(providerType);
  const memoResults = await provider.generateInvestmentMemo(aiInputs);

  let totalInserted = 0;
  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalConfidence = 0;
  let strongBuyCount = 0;

  for (const opp of eligible) {
    const idx = inputsByOpportunity.get(opp.opportunityId);
    if (idx === undefined) {
      totalSkipped++;
      continue;
    }
    const memo = memoResults[idx];
    if (!memo) {
      totalSkipped++;
      continue;
    }

    totalGenerated++;
    totalConfidence += memo.confidence;
    if (memo.recommendation === "STRONG BUY") strongBuyCount++;

    const score = await scoresRepo.findByOpportunity(opp.opportunityId);
    const report = await reportsRepo.findByOpportunity(opp.opportunityId);
    if (!score || !report) {
      totalSkipped++;
      continue;
    }

    // Re-check idempotency inside the loop (race safety)
    const existing = await memosRepo.findByOpportunity(opp.opportunityId);
    if (existing) {
      totalSkipped++;
      continue;
    }

    await memosRepo.create({
      opportunity_id: opp.opportunityId,
      venture_report_id: report.id,
      investment_score_id: score.id,
      title: memo.title,
      thesis: memo.thesis,
      market: memo.market,
      problem: memo.problem,
      solution: memo.solution,
      business_model: memo.business_model,
      traction: memo.traction,
      competition: memo.competition,
      risks: memo.risks,
      strengths: memo.strengths,
      why_now: memo.why_now,
      investment_decision: memo.investment_decision,
      recommendation: memo.recommendation,
      confidence: round2(memo.confidence),
      memo_version: 1,
    });
    totalInserted++;

    emitAnalytics({
      event: "investment_memo_generated",
      opportunityId: opp.opportunityId,
      confidence: memo.confidence,
      recommendation: memo.recommendation,
    });

    await triggerInvestorReadyAlertIfNeeded(
      opp.opportunityId,
      memo.recommendation,
      memo.confidence,
      opp.title,
    );
  }

  if (totalInserted > 0) {
    emitAnalytics({
      event: "average_memo_confidence",
      value: round2(totalConfidence / totalInserted),
    });
    emitAnalytics({
      event: "strong_buy_memo_count",
      value: strongBuyCount,
    });
  }

  return {
    processed: eligible.length + (scoreCards.length - eligible.length),
    generated: totalGenerated,
    skipped: totalSkipped + (scoreCards.length - eligible.length),
    inserted: totalInserted,
  };
}

/**
 * Get top memos, sorted by created_at desc.
 */
export async function getTopMemos(
  limit: number = 10,
): Promise<InvestmentMemoCardData[]> {
  const repo = await InvestmentMemosRepository.create();
  return repo.listCards({ limit });
}

/**
 * Aggregate investment memo stats for dashboard / KPI cards.
 */
export async function getStatistics(): Promise<InvestmentMemoStats> {
  const repo = await InvestmentMemosRepository.create();
  return repo.getStats();
}

/**
 * Get the latest memo for a specific opportunity.
 */
export async function getOpportunityMemo(
  opportunityId: string,
): Promise<InvestmentMemoRow | null> {
  const repo = await InvestmentMemosRepository.create();
  return repo.findByOpportunity(opportunityId);
}

/**
 * Fetch a memo by id (PK). Returns null if not found.
 */
export async function getMemoById(
  memoId: string,
): Promise<InvestmentMemoRow | null> {
  const repo = await InvestmentMemosRepository.create();
  return repo.findById(memoId);
}

/**
 * Count STRONG BUY memos (KPI for dashboard).
 */
export async function getStrongBuyCount(): Promise<number> {
  const repo = await InvestmentMemosRepository.create();
  return repo.strongBuyCount();
}

/**
 * Full-text + faceted search across memos.
 * Delegates to the repository; service is a thin orchestration layer.
 */
export async function searchMemos(
  filters: InvestmentMemoSearchFilters,
): Promise<InvestmentMemoRow[]> {
  const repo = await InvestmentMemosRepository.create();
  return repo.search(filters);
}

/**
 * Count for a search query (pagination support).
 */
export async function searchMemosCount(
  filters: InvestmentMemoSearchFilters,
): Promise<number> {
  const repo = await InvestmentMemosRepository.create();
  return repo.searchCount(filters);
}

/**
 * Record a "memo viewed" analytics event.
 * Called from the dashboard / detail pages when a memo is opened.
 */
export function trackMemoViewed(memoId: string, opportunityId: string): void {
  emitAnalytics({
    event: "memo_viewed",
    memoId,
    opportunityId,
  });
}

/**
 * Record a "memo exported" analytics event.
 * Called from the export endpoints.
 */
export function trackMemoExported(
  memoId: string,
  opportunityId: string,
  format: "pdf" | "markdown" | "json" | "docx",
): void {
  emitAnalytics({
    event: "memo_exported",
    memoId,
    opportunityId,
    format,
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emitAnalytics(payload: Record<string, unknown>): void {
  console.info("[analytics] investment_memo", JSON.stringify(payload));
}

/**
 * If recommendation == "STRONG BUY", create a "💰 Investor Ready Startup"
 * alert for every user whose watchlist matches the opportunity.
 */
async function triggerInvestorReadyAlertIfNeeded(
  opportunityId: string,
  recommendation: string,
  _confidence: number,
  _opportunityTitle: string,
): Promise<void> {
  if (recommendation !== "STRONG BUY") return;

  try {
    const { MatchingService } = await import("@/services/matching/matching.service");
    const { AlertsRepository } = await import("@/lib/db/repositories/alerts.repository");
    const { EmailService } = await import("@/services/email/email.service");
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
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
          `[InvestmentMemo] Failed to queue email for user ${match.userId}:`,
          err,
        );
      }
    }
  } catch (err) {
    console.error(`[InvestmentMemo] Failed to trigger Investor Ready alert:`, err);
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Suppress unused-import warning for type-only export.
// ---------------------------------------------------------------------------
export type { InvestmentMemoInput };