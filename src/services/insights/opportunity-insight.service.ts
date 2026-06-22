/**
 * Sprint 46: Opportunity Insight service.
 *
 * Flow:
 *   `opportunities` → `generateInsights()` → `repository.create()` → `opportunity_insights`
 *
 * Two main entry points:
 *   - `generateInsights(insights)`  : business-data in (no IDs), repo rows out
 *   - `generateInsightsFromDatabase()`  : pull opportunities from DB, project
 *                                       to AI input shape, ask the AI provider,
 *                                       persist insights, return rows
 *
 * Inputs are always `OpportunityInput[]` (business-only) — the service is
 * responsible for mapping UUIDs back to the rows when persisting.
 */

import { OpportunityInsightsRepository } from "@/lib/db/repositories/opportunity-insights.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { getAIProviderFromEnv } from "@/lib/ai";
import type {
  OpportunityInsightCardData,
  OpportunityInsightInput,
  OpportunityInsightRow,
  OpportunityInsightFilters,
} from "@/types/opportunity-insight";
import type { OpportunityInput } from "@/types/pipeline";
import type { Uuid } from "@/types";

type RawOpportunityWithCluster = {
  id: Uuid;
  score: number;
  frequency: number;
  severity: number;
  buying_intent: number;
  cluster_size: number | null;
  recency_score: string | null;
  source_diversity: string | null;
  pain_clusters: {
    name: string;
    description: string;
  };
};

const DEFAULT_RECENTS = 5;

export class OpportunityInsightService {
  constructor(
    private readonly insightsRepo: OpportunityInsightsRepository,
    private readonly opportunitiesRepo: OpportunitiesRepository,
  ) {}

  static async create(): Promise<OpportunityInsightService> {
    const [insightsRepo, opportunitiesRepo] = await Promise.all([
      OpportunityInsightsRepository.create(),
      OpportunitiesRepository.create(),
    ]);
    return new OpportunityInsightService(insightsRepo, opportunitiesRepo);
  }

  /**
   * Generate insights from pre-built business inputs, persist them, and
   * return the saved rows aligned with their source opportunities.
   *
   * The caller is expected to pass opportunity IDs in the same order as
   * the inputs. The service never mutates inputs.
   */
  async generateInsights(
    opportunities: Array<{ id: Uuid; input: OpportunityInput }>,
  ): Promise<OpportunityInsightRow[]> {
    if (opportunities.length === 0) return [];

    const ai = getAIProviderFromEnv();
    const aiInputs = opportunities.map((pair) => pair.input);
    const insights: OpportunityInsightInput[] = await ai.generateInsights(aiInputs);

    if (insights.length !== opportunities.length) {
      console.warn(
        `[generateInsights] AI returned ${insights.length} insights for ${opportunities.length} inputs — pairing greedily`,
      );
    }

    const persisted: OpportunityInsightRow[] = [];
    for (let i = 0; i < opportunities.length; i++) {
      const target = opportunities[i];
      const insight = insights[i];
      if (!target || !insight) continue;

      const row = await this.insightsRepo.create({
        opportunity_id: target.id,
        summary: insight.summary,
        market_size: insight.market_size,
        competition_level: insight.competition_level,
        urgency: insight.urgency,
        recommended_mvp: insight.recommended_mvp,
        recommended_channels: insight.recommended_channels,
        confidence_score: clamp01(insight.confidence_score, 0.5),
      });
      persisted.push(row);
    }

    return persisted;
  }

  /**
   * Pull the most recent (or all, capped at `limit`) opportunities from
   * the DB, build AI inputs from each row, and persist the resulting
   * insights. Defaults to the top-scoring 20 opportunities.
   */
  async generateInsightsFromDatabase(
    limit = 20,
  ): Promise<{
    scanned: number;
    created: number;
  }> {
    // We want opportunities that don't yet have an insight so we don't
    // burn the AI quota idempotently (the unique index would discard
    // duplicates anyway).
    const existing = await this.listCardData({ limit: 200 });
    const existingIds = new Set(existing.map((row) => row.opportunity_id));

    const rows: import("@/lib/db/repositories").OpportunityWithCluster[] =
      await this.opportunitiesRepo.findMany({ limit: Math.max(limit * 2, 50) });

    const candidates = rows
      .filter((row) => !existingIds.has(row.id))
      .slice(0, limit);

    if (candidates.length === 0) {
      return { scanned: rows.length, created: 0 };
    }

    const pairs = candidates.map((row) => ({
      id: row.id,
      input: this.toAiInput(row),
    }));

    const created = await this.generateInsights(pairs);
    return { scanned: rows.length, created: created.length };
  }

  /**
   * Read a single insight by opportunity id (enriched with the parent
   * opportunity's title/score for the AI Analysis card on detail pages).
   */
  async findInsight(opportunityId: Uuid): Promise<OpportunityInsightCardData | null> {
    const card = await this.insightsRepo.findCardByOpportunityId(opportunityId);
    return card ? toCard(card) : null;
  }

  /**
   * List insights for the history page + filters.
   */
  async listInsights(
    filters: OpportunityInsightFilters = {},
  ): Promise<{
    items: OpportunityInsightCardData[];
    total: number;
  }> {
    const [items, total] = await Promise.all([
      this.insightsRepo.listLatest(filters),
      this.insightsRepo.count(filters),
    ]);
    return {
      items: items.map(toCard),
      total,
    };
  }

  /**
   * Light-weight list of the latest N insights for the dashboard widget.
   */
  async listRecentInsights(
    limit: number = DEFAULT_RECENTS,
  ): Promise<OpportunityInsightCardData[]> {
    const recent = await this.insightsRepo.listRecentCards(limit);
    return recent.map(toCard);
  }

  /**
   * Internal helper: collapse a list of enriched cards when no
   * filter is supplied.
   */
  private async listCardData(
    filters: OpportunityInsightFilters = {},
  ): Promise<OpportunityInsightCardData[]> {
    const rows = await this.insightsRepo.listLatest(filters);
    return rows.map(toCard);
  }

  /**
   * Project an opportunity + cluster row into the AI-domain shape.
   * Pure business fields, no UUIDs.
   */
  private toAiInput(row: RawOpportunityWithCluster): OpportunityInput {
    return {
      score: typeof row.score === "number" ? row.score : Number(row.score) || 0,
      frequency: row.frequency,
      severity: typeof row.severity === "number"
        ? row.severity
        : Number(row.severity) || 0,
      buying_intent: typeof row.buying_intent === "number"
        ? row.buying_intent
        : Number(row.buying_intent) || 0,
      cluster_size: row.cluster_size ?? undefined,
      recency_score: row.recency_score ? Number(row.recency_score) : undefined,
      source_diversity: row.source_diversity
        ? Number(row.source_diversity)
        : undefined,
      cluster_name: row.pain_clusters.name,
      cluster_description: row.pain_clusters.description,
    };
  }
}

function clamp01(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

type PerRowCard = OpportunityInsightRow & {
  opportunity_title: string;
  opportunity_score: number;
};

function toCard(row: PerRowCard): OpportunityInsightCardData {
  return {
    id: row.id,
    opportunity_id: row.opportunity_id,
    summary: row.summary,
    market_size: row.market_size,
    competition_level: row.competition_level,
    urgency: row.urgency,
    recommended_mvp: row.recommended_mvp,
    recommended_channels: row.recommended_channels,
    confidence_score: row.confidence_score,
    created_at: row.created_at,
    opportunity_title: row.opportunity_title,
    opportunity_score: row.opportunity_score,
  };
}
