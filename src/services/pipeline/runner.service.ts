/**
 * Pipeline Runner - orchestrates the entire Opportunity Hunter pipeline
 *
 * Flow:
 * Multi-source ingestion → raw_posts → pain_points → embeddings → pain_clusters → opportunities → validation → startup_ideas → market_evidence
 */

import { fetchAllSources } from "@/services/sources/ingestion.service";
import { RawPostsRepository } from "@/lib/db/repositories";
import { extractPainPointsFromPosts } from "./pain-points.service";
import { generateEmbeddingsFromDatabase } from "./embeddings.service";
import { clusterPainPointsFromDatabase } from "./clusters.service";
import { generateOpportunitiesFromDatabase } from "./opportunities.service";
import { generateStartupIdeasFromDatabase } from "./startup-ideas.service";
import { validateOpportunitiesFromDatabase } from "../validation/validation.service";
import { generateEvidenceBatch } from "../evidence/evidence.service";
import { generateForecastBatch } from "../forecasts/forecast.service";

/**
 * Result of a complete pipeline run
 */
export interface PipelineRunResult {
  sources: number;
  rawPosts: number;
  painPoints: number;
  embeddings: number;
  clusters: number;
  opportunities: number;
  validated: number;
  ideas: number;
  averageClusterSize: number;
  largestClusterSize: number;
  forecasts?: number;
  forecastAlerts?: number;
  marketIntelligence?: number;
  startupScores?: number;
  ventureReports?: number;
  investmentMemos?: number;
  committeeDecisions?: number;
}

/**
 * Run the complete Opportunity Hunter pipeline
 *
 * Stages:
 * 1. Ingest posts from multiple sources (Reddit, Hacker News)
 * 2. Extract pain points from raw posts
 * 3. Cluster similar pain points
 * 4. Generate opportunities from clusters
 * 5. Generate startup ideas from opportunities
 *
 * @returns Pipeline execution results with counts for each stage
 *
 * @throws Error if any pipeline stage fails
 *
 * @example
 * ```typescript
 * const result = await runPipeline();
 * console.log(result);
 * // {
 * //   sources: 2,
 * //   rawPosts: 22,
 * //   painPoints: 45,
 * //   clusters: 8,
 * //   opportunities: 7,
 * //   ideas: 5
 * // }
 * ```
 */
export async function runPipeline(): Promise<PipelineRunResult> {
  try {
    // Stage 1: Ingest posts from all sources
    const rawPosts = await fetchAllSources(25);
    const sourcesCount = new Set(rawPosts.map((post) => post.source)).size;

    if (rawPosts.length === 0) {
      console.warn("No posts fetched from any source. Pipeline cannot continue.");
      throw new Error("No posts fetched from any source");
    }

    console.log(`Fetched ${rawPosts.length} posts from ${sourcesCount} sources`);

    // Insert posts into database
    const repository = await RawPostsRepository.create();

    // Check for existing URLs to prevent duplicates
    const existingPosts = await repository.list({ limit: 1000 });
    const existingUrls = new Set(existingPosts.map((post) => post.url));

    // Filter out duplicates
    const newPosts = rawPosts.filter((post) => !existingUrls.has(post.url));

    let insertedCount = 0;
    if (newPosts.length > 0) {
      const result = await repository.createMany(newPosts);
      insertedCount = result.length;
      console.log(`Inserted ${insertedCount} new posts`);
    } else {
      console.log("No new posts to insert (all duplicates)");
    }
    
    // Stage 2: Extract pain points
    const painPoints = await extractPainPointsFromPosts(50);

    if (painPoints.inserted === 0) {
      console.log("No new pain points extracted (all duplicates or no posts)");
    }

    // Stage 3: Generate embeddings for pain points (optional - requires OpenAI provider)
    let embeddingsResult = { processed: 0, skipped: 0, inserted: 0 };
    try {
      embeddingsResult = await generateEmbeddingsFromDatabase(1000);
      
      if (embeddingsResult.inserted === 0) {
        console.log("No new embeddings generated (all pain points already have embeddings or provider not supported)");
      } else {
        console.log(`Generated ${embeddingsResult.inserted} embeddings (${embeddingsResult.skipped} skipped)`);
      }
    } catch (error) {
      // Embeddings are optional - log error but don't fail pipeline
      console.warn("Embeddings generation failed (optional stage):", error);
    }

    // Stage 4: Cluster pain points
    const clusters = await clusterPainPointsFromDatabase(100);

    if (clusters.inserted === 0) {
      console.log("No new clusters created (all duplicates or no pain points)");
    }

    // Stage 5: Generate opportunities
    const opportunities = await generateOpportunitiesFromDatabase(50);

    if (opportunities.inserted === 0) {
      console.log("No new opportunities generated (all duplicates or no clusters)");
    }

    // Stage 6: Validate opportunities (deterministic scoring)
    const validationResult = await validateOpportunitiesFromDatabase(100);
    console.log(
      `Validated ${validationResult.validated} opportunities ` +
      `(${validationResult.skipped} skipped, ${validationResult.inserted} inserted)`,
    );

    // Stage 7: Generate startup ideas (only from validated opportunities with score >= 70)
    const ideas = await generateStartupIdeasFromDatabase(50);

    if (ideas.inserted === 0) {
      console.log("No new startup ideas generated (all duplicates or no opportunities)");
    }

    // Stage 8: Generate market evidence (only from validated opportunities with score >= 70)
    const evidenceResult = await generateEvidenceBatch(50);
    console.log(
      `Generated market evidence: ${evidenceResult.inserted} records ` +
      `(${evidenceResult.skipped} skipped, ${evidenceResult.generated} total generated)`,
    );

    // Stage 9: Generate forecasts (only from validated opportunities with score >= 70)
    const forecastResult = await generateForecastBatch(50);
    console.log(
      `Generated forecasts: ${forecastResult.inserted} records ` +
      `(${forecastResult.skipped} skipped, ${forecastResult.generated} total generated)`,
    );

    // Stage 10: Trigger forecast alerts for breakout opportunities (forecast_score > 90)
    const { processForecastAlerts } = await import("../forecasts/forecast-alerts.service");
    const forecastAlertResult = await processForecastAlerts();
    console.log(
      `Forecast alerts: ${forecastAlertResult.alertsCreated} created ` +
      `(${forecastAlertResult.triggered} triggered, ${forecastAlertResult.emailsQueued} emails queued)`,
    );

    // Stage 11: Generate market intelligence (only for opportunities with
    // validation_score >= 70 AND forecast_score >= 70).
    // Triggers "🔥 Massive Market Signal" alert when overall_score > 90.
    const { generateBatch: generateMarketIntelligenceBatch } = await import("../market-intelligence/market-intelligence.service");
    const intelligenceResult = await generateMarketIntelligenceBatch(50);
    console.log(
      `Generated market intelligence: ${intelligenceResult.inserted} records ` +
      `(${intelligenceResult.skipped} skipped, ${intelligenceResult.generated} total generated)`,
    );

    // Stage 12: Generate VC-style startup scores (only for opportunities
    // with validation >= 70 AND forecast >= 70 AND market_intelligence >= 70).
    // Triggers "⭐ Investment Grade Startup" alert when overall_score >= 90.
    const { generateBatch: generateStartupScoreBatch } = await import("../startup-score/startup-score.service");
    const startupScoreResult = await generateStartupScoreBatch(50);
    console.log(
      `Generated startup scores: ${startupScoreResult.inserted} records ` +
      `(${startupScoreResult.skipped} skipped, ${startupScoreResult.generated} total generated)`,
    );

    // Stage 13: Generate Venture Research Reports (only for opportunities
    // with startup_score overall_score >= 80).
    // Triggers "🚀 VC Grade Opportunity" alert when recommendation == "STRONG BUY".
    const { generateBatch: generateVentureReportBatch } = await import("../venture-report/venture-report.service");
    const ventureReportResult = await generateVentureReportBatch(50);
    console.log(
      `Generated venture reports: ${ventureReportResult.inserted} records ` +
      `(${ventureReportResult.skipped} skipped, ${ventureReportResult.generated} total generated)`,
    );

    // Stage 14: Generate Investment Memos (only for opportunities
    // with startup_score overall_score >= 85 AND a venture_report).
    // Triggers "💰 Investor Ready Startup" alert when recommendation == "STRONG BUY".
    const { generateBatch: generateInvestmentMemoBatch } = await import("../investment-memo/investment-memo.service");
    const investmentMemoResult = await generateInvestmentMemoBatch(50);
    console.log(
      `Generated investment memos: ${investmentMemoResult.inserted} records ` +
      `(${investmentMemoResult.skipped} skipped, ${investmentMemoResult.generated} total generated)`,
    );

    // Stage 15: Run AI Investment Committee (only for opportunities
    // with an investment_memo). Five independent AI "VC partners" vote.
    // Triggers "🎯 Committee Strong Buy" or "⚠️ Low Consensus" alerts.
    const { generateCommitteesForOpportunities: generateCommittees } = await import("../../lib/services/committee.service");
    // Fetch opportunities with investment memos
    const { getSupabaseServiceClient } = await import("@/lib/supabase");
    const supabase = getSupabaseServiceClient();
    const { data: memosData } = await supabase
      .from("investment_memos")
      .select(`
        opportunity_id,
        opportunities!inner(
          id,
          title,
          score,
          cluster_size,
          severity,
          buying_intent
        )
      `)
      .limit(50);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const committeeInputs = (memosData ?? []).map((m: any) => ({
      id: m.opportunity_id,
      context: {
        opportunity: {
          title: m.opportunities.title,
          description: m.opportunities.title,
          score: parseFloat(m.opportunities.score),
          cluster_size: m.opportunities.cluster_size,
          severity: parseFloat(m.opportunities.severity),
          buying_intent: parseFloat(m.opportunities.buying_intent),
        },
      },
    }));
    
    const committeeResult = await generateCommittees(committeeInputs);
    console.log(
      `Generated committee decisions: ${committeeResult.inserted} records ` +
      `(${committeeResult.skipped} skipped, ${committeeResult.generated} total generated)`,
    );

    return {
      sources: sourcesCount,
      rawPosts: insertedCount,
      painPoints: painPoints.inserted,
      embeddings: embeddingsResult.inserted,
      clusters: clusters.inserted,
      opportunities: opportunities.inserted,
      validated: validationResult.validated,
      ideas: ideas.inserted,
      averageClusterSize: clusters.averageClusterSize,
      largestClusterSize: clusters.largestClusterSize,
      forecasts: forecastResult.inserted,
      forecastAlerts: forecastAlertResult.alertsCreated,
      marketIntelligence: intelligenceResult.inserted,
      startupScores: startupScoreResult.inserted,
      ventureReports: ventureReportResult.inserted,
      investmentMemos: investmentMemoResult.inserted,
      committeeDecisions: committeeResult.inserted,
    };
  } catch (error) {
    // Determine which stage failed and provide meaningful error
    const message = error instanceof Error ? error.message : String(error);
    
    if (message.includes("reddit") || message.includes("Reddit")) {
      throw new Error(`Pipeline failed at stage 1 (Reddit ingestion): ${message}`);
    } else if (message.includes("pain_point") || message.includes("pain point")) {
      throw new Error(`Pipeline failed at stage 2 (pain point extraction): ${message}`);
    } else if (message.includes("embedding")) {
      throw new Error(`Pipeline failed at stage 3 (embeddings generation): ${message}`);
    } else if (message.includes("cluster")) {
      throw new Error(`Pipeline failed at stage 4 (clustering): ${message}`);
    } else if (message.includes("opportunit")) {
      throw new Error(`Pipeline failed at stage 5 (opportunity generation): ${message}`);
    } else if (message.includes("validat")) {
      throw new Error(`Pipeline failed at stage 6 (opportunity validation): ${message}`);
    } else if (message.includes("idea") || message.includes("startup")) {
      throw new Error(`Pipeline failed at stage 7 (startup idea generation): ${message}`);
    } else if (message.includes("evidence") || message.includes("market_evidence")) {
      throw new Error(`Pipeline failed at stage 8 (market evidence generation): ${message}`);
    } else if (message.includes("forecast")) {
      throw new Error(`Pipeline failed at stage 9 (forecasting): ${message}`);
    } else if (message.includes("intelligence") || message.includes("market_intelligence")) {
      throw new Error(`Pipeline failed at stage 11 (market intelligence generation): ${message}`);
    } else if (message.includes("startup") || message.includes("scoreStartup")) {
      throw new Error(`Pipeline failed at stage 12 (startup scoring): ${message}`);
    } else if (message.includes("venture") || message.includes("venture_report")) {
      throw new Error(`Pipeline failed at stage 13 (venture report generation): ${message}`);
    } else if (message.includes("memo") || message.includes("investment_memo")) {
      throw new Error(`Pipeline failed at stage 14 (investment memo generation): ${message}`);
    } else if (message.includes("committee") || message.includes("investment_committee")) {
      throw new Error(`Pipeline failed at stage 15 (committee generation): ${message}`);
    } else {
      throw new Error(`Pipeline failed: ${message}`);
    }
  }
}
