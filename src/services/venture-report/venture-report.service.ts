/**
 * Sprint 57: Venture Research Report Service
 *
 * Responsibilities:
 * - Generate venture research reports for investment-grade opportunities
 * - Only generates when startup_score overall_score >= 80
 * - Persist report records to database
 * - Trigger "VC Grade Opportunity" alert when recommendation == "STRONG BUY"
 * - Track analytics events
 */

import type { OpportunityInput } from "@/types/pipeline";
import type {
  VentureReportCardData,
  VentureReportGenerationResult,
  VentureReportRow,
  VentureReportStats,
} from "@/types/venture-report";
import { createAIProvider, getAIProviderFromEnv } from "@/lib/ai";
import { VentureReportsRepository } from "@/lib/db/repositories/venture-reports.repository";
import { StartupScoresRepository } from "@/lib/db/repositories/startup-scores.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";

/**
 * Threshold for generating venture reports (matches Sprint 57 spec).
 * Only generates for opportunities with startup_score overall_score >= 80.
 */
export const VENTURE_REPORT_SCORE_THRESHOLD = 80;

/**
 * Confidence threshold for investment-grade reports.
 */
export const INVESTMENT_GRADE_CONFIDENCE_THRESHOLD = 80;

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
 * Generate venture report for a single opportunity (if eligible).
 *
 * Gates:
 * - startup_score overall_score >= 80
 */
export async function generate(
  opportunityId: string,
  providerType?: AIProviderType,
): Promise<VentureReportGenerationResult> {
  const reportsRepo = await VentureReportsRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  const opportunity = await opportunityRepo.findById(opportunityId);
  if (!opportunity) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const score = await scoresRepo.findByOpportunity(opportunityId);
  if (!score) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  if (Number(score.overall_score) < VENTURE_REPORT_SCORE_THRESHOLD) {
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
  const [report] = await provider.generateVentureReport([opportunityInput]);

  if (!report) {
    return { processed: 1, generated: 0, skipped: 0, inserted: 0 };
  }

  // Idempotent: check if report already exists
  const existing = await reportsRepo.findByOpportunity(opportunityId);
  if (existing) {
    // Optionally update if version changed - for now skip
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  await reportsRepo.create({
    opportunity_id: opportunityId,
    startup_score_id: score.id,
    title: report.title,
    executive_summary: report.executive_summary,
    problem: report.problem,
    market_analysis: report.market_analysis,
    tam_analysis: report.tam_analysis,
    competition_analysis: report.competition_analysis,
    customer_segments: report.customer_segments,
    business_model: report.business_model,
    pricing_strategy: report.pricing_strategy,
    go_to_market: report.go_to_market,
    distribution_strategy: report.distribution_strategy,
    product_roadmap: report.product_roadmap,
    technical_risks: report.technical_risks,
    business_risks: report.business_risks,
    competitive_advantages: report.competitive_advantages,
    moat_analysis: report.moat_analysis,
    financial_outlook: report.financial_outlook,
    recommendation: report.recommendation,
    confidence: Math.round(report.confidence * 100) / 100,
    report_version: 1,
  });

  // Analytics: track generation
  emitAnalytics({
    event: "venture_report_generated",
    opportunityId,
    confidence: report.confidence,
    recommendation: report.recommendation,
  });

  // Alert: trigger if recommendation == "STRONG BUY"
  await triggerVCGradeAlertIfNeeded(
    opportunityId,
    report.recommendation,
    report.confidence,
    opportunity.title,
  );

  return { processed: 1, generated: 1, skipped: 0, inserted: 1 };
}

/**
 * Generate venture reports in batch for all eligible opportunities.
 *
 * Eligibility:
 * - startup_score overall_score >= 80
 *
 * @param limit - Maximum number of opportunities to process
 * @param providerType - Override AI provider type
 */
export async function generateBatch(
  limit: number = 50,
  providerType?: AIProviderType,
): Promise<VentureReportGenerationResult> {
  const reportsRepo = await VentureReportsRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  // Get all startup scores with overall_score >= 80
  const scoreCards = await scoresRepo.listCards({ limit, minScore: VENTURE_REPORT_SCORE_THRESHOLD });
  if (scoreCards.length === 0) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const opportunityIds = scoreCards.map((s) => s.opportunity_id);
  const opportunities = await opportunityRepo.findByIds(opportunityIds);

  // Build AI inputs
  const aiInputs: OpportunityInput[] = [];
  const eligible: Array<{ opportunityId: string; score: number; title: string }> = [];

  for (const card of scoreCards) {
    const opp = opportunities.find((o) => o?.id === card.opportunity_id);
    if (!opp) continue;

    aiInputs.push(
      buildOpportunityInput(
        card.opportunity_id,
        card.overall_score,
        opp.title,
        opp.description,
        opp.frequency,
        Number(opp.severity ?? 0),
        Number(opp.buying_intent ?? 0),
      ),
    );
    eligible.push({
      opportunityId: card.opportunity_id,
      score: card.overall_score,
      title: opp.title,
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
  const reportResults = await provider.generateVentureReport(aiInputs);

  let totalInserted = 0;
  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalConfidence = 0;
  let strongBuyCount = 0;

  for (let i = 0; i < eligible.length; i++) {
    const opp = eligible[i];
    const report = reportResults[i];
    if (!opp || !report) {
      totalSkipped++;
      continue;
    }

    totalGenerated++;
    totalConfidence += report.confidence;
    if (report.recommendation === "STRONG BUY") strongBuyCount++;

    // Idempotent: check if already exists
    const existing = await reportsRepo.findByOpportunity(opp.opportunityId);
    if (existing) {
      totalSkipped++;
      continue;
    }

    const score = await scoresRepo.findByOpportunity(opp.opportunityId);
    if (!score) {
      totalSkipped++;
      continue;
    }

    await reportsRepo.create({
      opportunity_id: opp.opportunityId,
      startup_score_id: score.id,
      title: report.title,
      executive_summary: report.executive_summary,
      problem: report.problem,
      market_analysis: report.market_analysis,
      tam_analysis: report.tam_analysis,
      competition_analysis: report.competition_analysis,
      customer_segments: report.customer_segments,
      business_model: report.business_model,
      pricing_strategy: report.pricing_strategy,
      go_to_market: report.go_to_market,
      distribution_strategy: report.distribution_strategy,
      product_roadmap: report.product_roadmap,
      technical_risks: report.technical_risks,
      business_risks: report.business_risks,
      competitive_advantages: report.competitive_advantages,
      moat_analysis: report.moat_analysis,
      financial_outlook: report.financial_outlook,
      recommendation: report.recommendation,
      confidence: Math.round(report.confidence * 100) / 100,
      report_version: 1,
    });
    totalInserted++;

    // Analytics
    emitAnalytics({
      event: "venture_report_generated",
      opportunityId: opp.opportunityId,
      confidence: report.confidence,
      recommendation: report.recommendation,
    });

    // Alert if STRONG BUY
    await triggerVCGradeAlertIfNeeded(
      opp.opportunityId,
      report.recommendation,
      report.confidence,
      opp.title,
    );
  }

  // Aggregate analytics events
  if (totalInserted > 0) {
    emitAnalytics({
      event: "average_venture_report_confidence",
      value: totalConfidence / totalInserted,
    });
    emitAnalytics({
      event: "strong_buy_venture_reports",
      value: strongBuyCount,
    });
  }

  return {
    processed: eligible.length,
    generated: totalGenerated,
    skipped: scoreCards.length - eligible.length + totalSkipped,
    inserted: totalInserted,
  };
}

/**
 * Get top venture reports, sorted by created_at desc.
 */
export async function getTopReports(
  limit: number = 10,
): Promise<VentureReportCardData[]> {
  const repo = await VentureReportsRepository.create();
  return repo.listCards({ limit });
}

/**
 * Aggregate venture report stats for dashboard.
 */
export async function getStatistics(): Promise<VentureReportStats> {
  const repo = await VentureReportsRepository.create();
  const stats = await repo.getStats();

  return {
    total: stats.total,
    averageConfidence: stats.averageConfidence,
    investmentGradeCount: stats.investmentGradeCount,
    strongBuyCount: stats.strongBuyCount,
    latestReportDate: stats.latestReportDate,
  };
}

/**
 * Get venture report for one opportunity.
 */
export async function getOpportunityReport(
  opportunityId: string,
): Promise<VentureReportRow | null> {
  const repo = await VentureReportsRepository.create();
  return repo.findByOpportunity(opportunityId);
}

/**
 * Count investment-grade reports.
 */
export async function getInvestmentGradeCount(): Promise<number> {
  const repo = await VentureReportsRepository.create();
  return repo.investmentGradeCount();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emitAnalytics(payload: Record<string, unknown>): void {
  console.info("[analytics] venture_report", JSON.stringify(payload));
}

/**
 * If recommendation == "STRONG BUY", create a "🚀 VC Grade Opportunity"
 * alert for every user whose watchlist matches the opportunity.
 */
async function triggerVCGradeAlertIfNeeded(
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
    const { getSupabaseServiceClient } = await import("@/lib/supabase");
    const { OpportunitiesRepository } = await import("@/lib/db/repositories/opportunities.repository");

    const client = getSupabaseServiceClient();
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
          `[VentureReport] Failed to queue email for user ${match.userId}:`,
          err,
        );
      }
    }
  } catch (err) {
    console.error(`[VentureReport] Failed to trigger VC Grade alert:`, err);
  }
}