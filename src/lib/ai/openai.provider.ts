/**
 * OpenAI Provider - uses GPT models for AI-powered pipeline stages.
 * Optimized with single-request batch processing (O(1) API calls per stage).
 *
 * Architecture:
 * - AI layer returns business data only
 * - NO IDs, NO foreign keys
 * - Database is single source of truth for UUIDs
 * - Services map AI outputs to database rows
 */
import OpenAI from "openai";

import type { AIProvider } from "@/types/ai";
import {
  PainPointSchema,
  ClusterSchema,
  OpportunitySchema,
  OpportunityInsightSchema,
  StartupIdeaSchema,
  ValidationSchema,
  EvidenceSchema,
  ForecastSchema,
  MarketIntelligenceSchema,
  StartupScoreSchema,
  InvestmentMemoSchema,
} from "./schemas";
import type {
  RawPostInput,
  PainPointInput,
  PainClusterInput,
  OpportunityInput,
  StartupIdeaInput,
} from "@/types/pipeline";
import type { OpportunityInsightInput } from "@/types/opportunity-insight";
import type { OpportunityValidationInput } from "@/types/validation";
import type { EvidenceInput } from "@/types/evidence";
import type { ForecastInput } from "@/types/forecast";
import type { MarketIntelligenceInput } from "@/types/market-intelligence";
import type { StartupScoreInput } from "@/types/startup-score";
import { logAiUsageFromResponse } from "./ai-usage";
import type { VentureReportInput } from "@/types/venture-report";
import type { InvestmentMemoInput } from "@/types/investment-memo";
import type { BacktestInput, BacktestEvaluation } from "@/types/backtesting";
import { VentureReportSchema, BacktestEvaluationSchema } from "./schemas";

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;

  constructor(
    private readonly apiKey?: string,
    private readonly model: string = "gpt-4o-mini",
  ) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required");
    }

    this.client = new OpenAI({
      apiKey,
    });
  }

  private getUserId(): string | null {
    // Attempt to read from a request-scoped context if available.
    // In production this would be injected via OpenAIProvider constructor
    // or a request-scoped singleton.
    return null;
  }

  private async trackUsage(model: string, usage: { prompt_tokens: number; completion_tokens: number }) {
    const opts = {
      provider: "openai" as const,
      model,
      usage,
      userId: this.getUserId(),
    };
    await logAiUsageFromResponse(opts);
  }

  async extractPainPoints(posts: RawPostInput[]): Promise<PainPointInput[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Extract one business pain point from each Reddit post.

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "pain": "string",
      "category": "string",
      "severity": number,
      "buying_intent": number
    }
  ]
}

severity and buying_intent must be between 0 and 1.
Return exactly ${posts.length} objects in the results array, one for each post.
Do NOT include markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: JSON.stringify(
              posts.map((post) => ({
                title: post.title,
                content: post.content,
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = parsed.results ?? [];

      if (!Array.isArray(results)) {
        console.error("extractPainPoints: response.results is not an array");
        return [];
      }

      return results
        .map((item) => {
          try {
            const validated = PainPointSchema.parse(item);
            return {
              pain: validated.pain,
              category: validated.category,
              severity: validated.severity,
              buying_intent: validated.buying_intent,
            };
          } catch {
            return null;
          }
        })
        .filter((item): item is PainPointInput => item !== null);
    } catch (error) {
      console.error("extractPainPoints failed:", error);
      return [];
    }
  }

  async clusterPainPoints(
    painPoints: PainPointInput[],
  ): Promise<PainClusterInput[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Group similar pain points into business clusters.

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "cluster_name": "string",
      "description": "string"
    }
  ]
}

Create meaningful clusters based on pain point similarity.
Do NOT include markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: JSON.stringify(
              painPoints.map((pp, index) => ({
                index,
                pain: pp.pain,
                category: pp.category,
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = parsed.results ?? [];

      if (!Array.isArray(results)) {
        console.error("clusterPainPoints: response.results is not an array");
        return [];
      }

      const clusterMap = new Map<
        string,
        { name: string; description: string; indexes: number[] }
      >();

      // Build cluster map from AI response
      for (const item of results) {
        try {
          const validated = ClusterSchema.parse(item);
          const name = validated.cluster_name;
          if (!clusterMap.has(name)) {
            clusterMap.set(name, {
              name,
              description: validated.description,
              indexes: [],
            });
          }
        } catch {
          // Skip invalid clusters
        }
      }

      // Assign pain points to clusters based on index matching
      // If AI returned N clusters for M pain points, distribute evenly
      const clusterNames = Array.from(clusterMap.keys());
      const pointsPerCluster = Math.ceil(painPoints.length / Math.max(clusterNames.length, 1));

      for (let i = 0; i < painPoints.length; i++) {
        const clusterIndex = Math.min(
          Math.floor(i / pointsPerCluster),
          clusterNames.length - 1,
        );
        const clusterName = clusterNames[clusterIndex];
        if (clusterName && clusterMap.has(clusterName)) {
          clusterMap.get(clusterName)!.indexes.push(i);
        }
      }

      return Array.from(clusterMap.values()).map((c) => ({
        cluster_name: c.name,
        description: c.description,
        pain_point_indexes: c.indexes,
      }));
    } catch (error) {
      console.error("clusterPainPoints failed:", error);
      return [];
    }
  }

  async generateOpportunities(
    clusters: PainClusterInput[],
  ): Promise<OpportunityInput[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Analyze each pain cluster and generate one business opportunity per cluster.

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "score": number,
      "frequency": number,
      "severity": number,
      "buying_intent": number
    }
  ]
}

score: 0-100
frequency: integer (number of pain points in cluster)
severity: 0-1
buying_intent: 0-1

Return exactly ${clusters.length} objects in the results array, one for each cluster.
Do NOT include markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: JSON.stringify(
              clusters.map((cluster) => ({
                cluster_name: cluster.cluster_name,
                description: cluster.description,
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = parsed.results ?? [];

      if (!Array.isArray(results)) {
        console.error("generateOpportunities: response.results is not an array");
        return [];
      }

      return results
        .map((item, index): OpportunityInput | null => {
          const cluster = clusters[index];
          if (!cluster) return null;
          
          try {
            const validated = OpportunitySchema.parse(item);
            return {
              score: validated.score,
              frequency: validated.frequency,
              severity: validated.severity,
              buying_intent: validated.buying_intent,
              cluster_name: cluster.cluster_name,
              cluster_description: cluster.description,
            };
          } catch {
            return null;
          }
        })
        .filter((item): item is OpportunityInput => item !== null);
    } catch (error) {
      console.error("generateOpportunities failed:", error);
      return [];
    }
  }

  async generateInsights(
    opportunities: OpportunityInput[],
  ): Promise<OpportunityInsightInput[]> {
    if (opportunities.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a startup strategist. For each opportunity below, produce ONE concise business insight in JSON.

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "summary": string,
      "market_size": string,
      "competition_level": "Low" | "Medium" | "High",
      "urgency": "Low" | "Medium" | "High",
      "recommended_mvp": string,
      "recommended_channels": string,
      "confidence_score": number
    }
  ]
}

Rules:
- summary: 1-3 sentences describing the core opportunity in human terms
- market_size: short qualifier such as "$1.2B TAM" or "Niche (~5k buyers)"
- competition_level and urgency: pick the most plausible of "Low"/"Medium"/"High"
- recommended_mvp: 1-2 sentence minimum-viable product description
- recommended_channels: comma-separated acquisition channels (e.g. "Reddit, Product Hunt, SEO")
- confidence_score: float between 0 and 1 (1-pip precision)
Return exactly ${opportunities.length} objects in the same order as the input.
Do NOT include markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: JSON.stringify(
              opportunities.map((opp) => ({
                score: Math.round(opp.score),
                frequency: opp.frequency,
                severity: Number(opp.severity.toFixed(3)),
                buying_intent: Number(opp.buying_intent.toFixed(3)),
                cluster_name: opp.cluster_name ?? "(unknown cluster)",
                cluster_description:
                  opp.cluster_description ?? "(no description)",
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed: unknown = JSON.parse(content);
      const results = (parsed as { results?: unknown }).results;
      if (!Array.isArray(results)) {
        console.error("generateInsights: response.results is not an array");
        return [];
      }

      return results
        .map((item): OpportunityInsightInput | null => {
          try {
            const validated = OpportunityInsightSchema.parse(item);
            return validated;
          } catch {
            return null;
          }
        })
        .filter((item): item is OpportunityInsightInput => item !== null);
    } catch (error) {
      console.error("generateInsights failed:", error);
      return [];
    }
  }

  async generateStartupIdeas(
    opportunities: OpportunityInput[],
  ): Promise<StartupIdeaInput[]> {
    if (opportunities.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a startup founder. Generate one startup idea for each business opportunity.

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "problem": "string",
      "solution": "string",
      "mvp": "string",
      "pricing": "string",
      "customer": "string",
      "distribution": "string",
      "competitors": "string"
    }
  ]
}

Return exactly ${opportunities.length} objects in the results array, one for each opportunity.
Do NOT include markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: JSON.stringify(
              opportunities.map((opp) => ({
                cluster_name: opp.cluster_name,
                score: opp.score,
                severity: opp.severity,
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });
      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = parsed.results ?? [];

      if (!Array.isArray(results)) {
        console.error("generateStartupIdeas: response.results is not an array");
        return [];
      }

      return results
        .map((item) => {
          try {
            const validated = StartupIdeaSchema.parse(item);
            return {
              problem: validated.problem,
              solution: validated.solution,
              mvp: validated.mvp,
              pricing: validated.pricing,
              customer: validated.customer,
              distribution: validated.distribution,
              competitors: validated.competitors,
            };
          } catch {
            return null;
          }
        })
        .filter((item): item is StartupIdeaInput => item !== null);
    } catch (error) {
      console.error("generateStartupIdeas failed:", error);
      return [];
    }
  }

  async validateOpportunities(
    opportunities: OpportunityInput[],
  ): Promise<OpportunityValidationInput[]> {
    if (opportunities.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a startup validation expert. Evaluate each opportunity and score it across 4 dimensions.

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "market_demand": number,
      "competition": number,
      "monetization": number,
      "build_difficulty": number,
      "validation_score": number,
      "reasoning": string
    }
  ]
}

Rules:
- market_demand (0-100): How big is the potential market? Higher = more people want this solved.
- competition (0-100): How crowded is the market? Higher = MORE competition (BAD for validation).
- monetization (0-100): How easily can this be monetised? Higher = easier to make money.
- build_difficulty (0-100): How hard is it to build? Higher = harder to build.
- validation_score (0-100): Weighted score — market_demand(30%) + monetization(35%) + (100-competition)(25%) + (100-build_difficulty)(10%).
- reasoning: 1-2 sentence explanation of the validation score.

IMPORTANT: validation_score must be your own calculated weighted average.
Return exactly ${opportunities.length} objects in the results array, one for each opportunity.
Do NOT include markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: JSON.stringify(
              opportunities.map((opp) => ({
                cluster_name: opp.cluster_name ?? "(unknown)",
                description: opp.cluster_description ?? "(no description)",
                score: opp.score,
                severity: Number(opp.severity.toFixed(3)),
                buying_intent: Number(opp.buying_intent.toFixed(3)),
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = parsed.results ?? [];

      if (!Array.isArray(results)) {
        console.error("validateOpportunities: response.results is not an array");
        return [];
      }

      return results
        .map((item) => {
          try {
            const validated = ValidationSchema.parse(item);
            return {
              market_demand: validated.market_demand,
              competition: validated.competition,
              monetization: validated.monetization,
              build_difficulty: validated.build_difficulty,
              validation_score: validated.validation_score,
              reasoning: validated.reasoning,
            };
          } catch {
            return null;
          }
        })
        .filter((item): item is OpportunityValidationInput => item !== null);
    } catch (error) {
      console.error("validateOpportunities failed:", error);
      return [];
    }
  }

  async findMarketEvidence(
    opportunities: OpportunityInput[],
  ): Promise<EvidenceInput[][]> {
    if (opportunities.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a market research analyst. For each business opportunity generate 5-10 pieces of market evidence.

Evidence types to generate (use a mix of these):
- competitor: Named companies solving the same problem (e.g. "Zapier", "Make", "Airtable")
- pricing: Market pricing signals for solutions in this space
- customer_quote: Customer complaints or requests that reveal demand
- market_report: Reports or data showing market growth/trend
- google_trend: Search trend evidence
- reddit: Reddit discussions showing community interest

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "opportunity_index": number,
      "evidence": [
        {
          "evidence_type": "competitor" | "pricing" | "customer_quote" | "market_report" | "google_trend" | "reddit",
          "source": "string",
          "title": "string",
          "url": "optional URL string",
          "summary": "string",
          "confidence": number
        }
      ]
    }
  ]
}

Rules:
- confidence: 0-100 (higher = more confident this evidence is real/relevant)
- Return evidence for ALL ${opportunities.length} opportunities
- opportunity_index must match the position in the input array (0-based)
- Include 5-10 evidence items per opportunity
- title should be a short, specific name (e.g. "Zapier raised $250M Series B" or "Workflow automation Reddit thread 12k upvotes")
- summary should be 1-2 sentences explaining why this evidence matters
- Use realistic company names and data where possible

Do NOT include markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: JSON.stringify(
              opportunities.map((opp, i) => ({
                index: i,
                cluster_name: opp.cluster_name ?? "(unknown)",
                description: opp.cluster_description ?? "(no description)",
                score: opp.score,
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed: unknown = JSON.parse(content);
      const results = (parsed as { results?: { opportunity_index: number; evidence: unknown[] }[] }).results ?? [];

      // Build output array in input order
      const output: EvidenceInput[][] = opportunities.map(() => []);
      for (const item of results) {
        const idx = item.opportunity_index;
        if (idx < 0 || idx >= opportunities.length) continue;
        for (const ev of item.evidence) {
          try {
            const validated = EvidenceSchema.parse(ev);
            output[idx].push({
              evidence_type: validated.evidence_type,
              source: validated.source,
              title: validated.title,
              url: validated.url,
              summary: validated.summary,
              confidence: validated.confidence,
            });
          } catch {
            // skip invalid evidence
          }
        }
      }
      return output;
    } catch (error) {
      console.error("findMarketEvidence failed:", error);
      return opportunities.map(() =>  []);
    }
  }

  async forecastOpportunities(
    opportunities: OpportunityInput[],
  ): Promise<ForecastInput[]> {
    if (opportunities.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a venture analyst. Predict future opportunity growth for each business opportunity.

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "forecast_score": number,
      "growth_probability": number,
      "confidence": number,
      "momentum": number,
      "prediction_summary": "string"
    }
  ]
}

Rules:
- forecast_score: 0-100 (overall forecast quality)
- growth_probability: 0-100 (percentage chance of growth)
- confidence: 0-100 (confidence in this forecast)
- momentum: 0-100 (current momentum indicator)
- prediction_summary: 1-2 sentence explanation
- Return exactly ${opportunities.length} objects in the results array
- Use the validation score, evidence, and trend data to inform predictions
- Do NOT include markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: JSON.stringify(
              opportunities.map((opp, i) => ({
                index: i,
                cluster_name: opp.cluster_name ?? "(unknown)",
                description: opp.cluster_description ?? "(no description)",
                validation_score: opp.score,
                severity: opp.severity,
                buying_intent: opp.buying_intent,
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = (parsed as { results?: unknown[] }).results ?? [];

      const output: ForecastInput[] = [];
      for (const item of results) {
        try {
          const validated = ForecastSchema.parse(item);
          output.push({
            forecast_score: validated.forecast_score,
            growth_probability: validated.growth_probability,
            confidence: validated.confidence,
            momentum: validated.momentum,
            prediction_summary: validated.prediction_summary,
          });
        } catch {
          // skip invalid forecast
        }
      }
      return output;
    } catch (error) {
      console.error("forecastOpportunities failed:", error);
      return opportunities.map(() => ({
        forecast_score: 0,
        growth_probability: 0,
        confidence: 0,
        momentum: 0,
        prediction_summary: "Forecast generation failed",
      }));
    }
  }

  async generateMarketIntelligence(
    opportunities: OpportunityInput[],
  ): Promise<MarketIntelligenceInput[]> {
    if (opportunities.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a venture capital market analyst.

Estimate external market signals for this opportunity.

Output ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "reddit_score": number,
      "github_score": number,
      "product_hunt_score": number,
      "news_score": number,
      "google_trends_score": number,
      "jobs_score": number,
      "overall_score": number,
      "confidence": number,
      "summary": string
    }
  ]
}

Rules:
- All scores are 0-100 (higher = stronger signal)
- reddit_score: community discussion volume on Reddit
- github_score: open-source activity, related repos, stars
- product_hunt_score: comparable launches and upvotes
- news_score: press coverage and industry mentions
- google_trends_score: search interest trajectory
- jobs_score: hiring signals for this problem space
- overall_score: weighted average of all 6 signals
- confidence: 0-100, how confident you are in the estimate
- summary: 1-2 sentence market intelligence summary
- Return exactly ${opportunities.length} objects in the results array, one for each opportunity
- Do NOT include markdown formatting or code blocks
- Output ONLY JSON`,
          },
          {
            role: "user",
            content: JSON.stringify(
              opportunities.map((opp, i) => ({
                index: i,
                cluster_name: opp.cluster_name ?? "(unknown)",
                description: opp.cluster_description ?? "(no description)",
                validation_score: opp.score,
                severity: Number(opp.severity.toFixed(3)),
                buying_intent: Number(opp.buying_intent.toFixed(3)),
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = (parsed as { results?: unknown[] }).results ?? [];

      const output: MarketIntelligenceInput[] = [];
      for (const item of results) {
        try {
          const validated = MarketIntelligenceSchema.parse(item);
          output.push({
            reddit_score: validated.reddit_score,
            github_score: validated.github_score,
            product_hunt_score: validated.product_hunt_score,
            news_score: validated.news_score,
            google_trends_score: validated.google_trends_score,
            jobs_score: validated.jobs_score,
            overall_score: validated.overall_score,
            confidence: validated.confidence,
            summary: validated.summary,
          });
        } catch {
          // skip invalid intelligence item
        }
      }
      return output;
    } catch (error) {
      console.error("generateMarketIntelligence failed:", error);
      return opportunities.map(() => ({
        reddit_score: 0,
        github_score: 0,
        product_hunt_score: 0,
        news_score: 0,
        google_trends_score: 0,
        jobs_score: 0,
        overall_score: 0,
        confidence: 0,
        summary: "Market intelligence generation failed",
      }));
    }
  }

  async scoreStartupPotential(
    opportunities: OpportunityInput[],
  ): Promise<StartupScoreInput[]> {
    if (opportunities.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a venture capitalist.

Evaluate this opportunity.

Score each category from 0–100:

- TAM (Total Addressable Market size)
- Market Timing (window of opportunity)
- Competition (crowdedness — higher = less crowded, more attractive)
- Moat (defensibility)
- Distribution (go-to-market channel strength)
- Execution (team/capability to ship)
- Capital Efficiency (revenue per dollar raised)

Provide:

- overall_score (0–100, weighted average)
- confidence (0–100)
- recommendation ("Strong Invest" | "Watch" | "Pass")
- summary (1-2 sentence analyst write-up)

Output ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "tam_score": number,
      "market_timing_score": number,
      "competition_score": number,
      "moat_score": number,
      "distribution_score": number,
      "execution_score": number,
      "capital_efficiency_score": number,
      "overall_score": number,
      "confidence": number,
      "recommendation": string,
      "summary": string
    }
  ]
}

Rules:
- All numeric scores are 0-100
- Return exactly ${opportunities.length} objects in the results array, one for each opportunity
- Do NOT include markdown formatting or code blocks
- Output ONLY JSON`,
          },
          {
            role: "user",
            content: JSON.stringify(
              opportunities.map((opp, i) => ({
                index: i,
                cluster_name: opp.cluster_name ?? "(unknown)",
                description: opp.cluster_description ?? "(no description)",
                validation_score: opp.score,
                severity: Number(opp.severity.toFixed(3)),
                buying_intent: Number(opp.buying_intent.toFixed(3)),
                frequency: opp.frequency ?? 0,
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = (parsed as { results?: unknown[] }).results ?? [];

      const output: StartupScoreInput[] = [];
      for (const item of results) {
        try {
          const validated = StartupScoreSchema.parse(item);
          output.push({
            tam_score: validated.tam_score,
            market_timing_score: validated.market_timing_score,
            competition_score: validated.competition_score,
            moat_score: validated.moat_score,
            distribution_score: validated.distribution_score,
            execution_score: validated.execution_score,
            capital_efficiency_score: validated.capital_efficiency_score,
            overall_score: validated.overall_score,
            confidence: validated.confidence,
            recommendation: validated.recommendation,
            summary: validated.summary,
          });
        } catch {
          // skip invalid score item
        }
      }
      return output;
    } catch (error) {
      console.error("scoreStartupPotential failed:", error);
      return opportunities.map(() => ({
        tam_score: 0,
        market_timing_score: 0,
        competition_score: 0,
        moat_score: 0,
        distribution_score: 0,
        execution_score: 0,
        capital_efficiency_score: 0,
        overall_score: 0,
        confidence: 0,
        recommendation: "Pass",
        summary: "Investment scoring failed",
      }));
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error("generateEmbeddings failed:", error);
      throw error;
    }
  }

  async generateVentureReport(
    opportunities: OpportunityInput[],
  ): Promise<VentureReportInput[]> {
    if (opportunities.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a Venture Capital partner writing an investment-grade startup research report.

Generate a comprehensive venture research report similar to documents used by YC, a16z, Sequoia, or internal VC research teams.

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "title": "string",
      "executive_summary": "string",
      "problem": "string",
      "market_analysis": "string",
      "tam_analysis": "string",
      "competition_analysis": "string",
      "customer_segments": "string",
      "business_model": "string",
      "pricing_strategy": "string",
      "go_to_market": "string",
      "distribution_strategy": "string",
      "product_roadmap": "string",
      "technical_risks": "string",
      "business_risks": "string",
      "competitive_advantages": "string",
      "moat_analysis": "string",
      "financial_outlook": "string",
      "recommendation": "string",
      "confidence": number
    }
  ]
}

Rules:
- All fields are required strings (except confidence which is 0-100 number)
- recommendation: "STRONG BUY" | "BUY" | "HOLD" | "PASS"
- confidence: 0-100
- Return exactly ${opportunities.length} objects in the results array, one for each opportunity
- Do NOT include markdown formatting or code blocks
- Output ONLY JSON`,
          },
          {
            role: "user",
            content: JSON.stringify(
              opportunities.map((opp, i) => ({
                index: i,
                cluster_name: opp.cluster_name ?? "(unknown)",
                description: opp.cluster_description ?? "(no description)",
                validation_score: opp.score,
                severity: Number(opp.severity.toFixed(3)),
                buying_intent: Number(opp.buying_intent.toFixed(3)),
                frequency: opp.frequency ?? 0,
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = (parsed as { results?: unknown[] }).results ?? [];

      const output: VentureReportInput[] = [];
      for (const item of results) {
        try {
          const validated = VentureReportSchema.parse(item);
          output.push({
            title: validated.title,
            executive_summary: validated.executive_summary,
            problem: validated.problem,
            market_analysis: validated.market_analysis,
            tam_analysis: validated.tam_analysis,
            competition_analysis: validated.competition_analysis,
            customer_segments: validated.customer_segments,
            business_model: validated.business_model,
            pricing_strategy: validated.pricing_strategy,
            go_to_market: validated.go_to_market,
            distribution_strategy: validated.distribution_strategy,
            product_roadmap: validated.product_roadmap,
            technical_risks: validated.technical_risks,
            business_risks: validated.business_risks,
            competitive_advantages: validated.competitive_advantages,
            moat_analysis: validated.moat_analysis,
            financial_outlook: validated.financial_outlook,
            recommendation: validated.recommendation,
            confidence: validated.confidence,
          });
        } catch {
          // skip invalid report item
        }
      }
      return output;
    } catch (error) {
      console.error("generateVentureReport failed:", error);
      return opportunities.map(() => ({
        title: "Report Generation Failed",
        executive_summary: "Could not generate report",
        problem: "",
        market_analysis: "",
        tam_analysis: "",
        competition_analysis: "",
        customer_segments: "",
        business_model: "",
        pricing_strategy: "",
        go_to_market: "",
        distribution_strategy: "",
        product_roadmap: "",
        technical_risks: "",
        business_risks: "",
        competitive_advantages: "",
        moat_analysis: "",
        financial_outlook: "",
        recommendation: "PASS",
        confidence: 0,
      }));
    }
  }

  async generateInvestmentMemo(
    opportunities: OpportunityInput[],
  ): Promise<InvestmentMemoInput[]> {
    if (opportunities.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a VC Partner.

Write a concise internal investment memo.

Use professional VC language and the same cadence as memos used by Y Combinator, Sequoia, Andreessen Horowitz, and Accel.

Return ONLY a valid JSON object with this structure:

{
  "results": [
    {
      "title": "string",
      "thesis": "string",
      "market": "string",
      "problem": "string",
      "solution": "string",
      "business_model": "string",
      "traction": "string",
      "competition": "string",
      "risks": "string",
      "strengths": "string",
      "why_now": "string",
      "investment_decision": "string",
      "recommendation": "string",
      "confidence": number
    }
  ]
}

Rules:
- All fields are required strings (except confidence which is 0-100)
- recommendation: "STRONG BUY" | "BUY" | "HOLD" | "PASS"
- confidence: 0-100
- Each section is concise: 2-4 sentences, decision-oriented, no fluff
- investment_decision must be a one-line directive ("INVEST — lead the round at $X-Y." / "PASS — revisit in N months.")
- Return exactly ${opportunities.length} objects in the results array, one for each opportunity
- Do NOT include markdown formatting or code blocks
- Output ONLY JSON`,
          },
          {
            role: "user",
            content: JSON.stringify(
              opportunities.map((opp, i) => ({
                index: i,
                cluster_name: opp.cluster_name ?? "(unknown)",
                description: opp.cluster_description ?? "(no description)",
                validation_score: opp.score,
                severity: Number(opp.severity.toFixed(3)),
                buying_intent: Number(opp.buying_intent.toFixed(3)),
                frequency: opp.frequency ?? 0,
              })),
            ),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content);
      const results = (parsed as { results?: unknown[] }).results ?? [];

      const output: InvestmentMemoInput[] = [];
      for (const item of results) {
        try {
          const validated = InvestmentMemoSchema.parse(item);
          output.push({
            title: validated.title,
            thesis: validated.thesis,
            market: validated.market,
            problem: validated.problem,
            solution: validated.solution,
            business_model: validated.business_model,
            traction: validated.traction,
            competition: validated.competition,
            risks: validated.risks,
            strengths: validated.strengths,
            why_now: validated.why_now,
            investment_decision: validated.investment_decision,
            recommendation: validated.recommendation,
            confidence: validated.confidence,
          });
        } catch {
          // skip invalid memo item
        }
      }
      return output;
    } catch (error) {
      console.error("generateInvestmentMemo failed:", error);
      return opportunities.map(() => ({
        title: "Investment Memo Generation Failed",
        thesis: "Could not generate memo",
        market: "",
        problem: "",
        solution: "",
        business_model: "",
        traction: "",
        competition: "",
        risks: "",
        strengths: "",
        why_now: "",
        investment_decision: "PASS — could not evaluate.",
        recommendation: "PASS",
        confidence: 0,
      }));
    }
  }

  async evaluateBacktest(inputs: BacktestInput[]): Promise<BacktestEvaluation[]> {
    if (inputs.length === 0) return [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a prediction accuracy analyst. Evaluate each backtest prediction and determine the actual score and accuracy.',
          },
          {
            role: 'user',
            content: JSON.stringify(inputs),
          },
        ],
      });
      await this.trackUsage(this.model, response.usage ?? { prompt_tokens: 0, completion_tokens: 0 });

      const content_text = response.choices[0]?.message?.content?.trim() ?? '';
      const parsed = JSON.parse(content_text);
      const results = Array.isArray(parsed) ? parsed : (parsed.results ?? []);

      return results.map((item: Record<string, unknown>) => ({
        actual_score: Number(item.actual_score),
        prediction_delta: Number(item.prediction_delta),
        accuracy: Number(item.accuracy),
        notes: String(item.notes ?? ''),
      }));
    } catch (error) {
      console.error('evaluateBacktest failed:', error);
      return inputs.map((input) => ({
        actual_score: input.current_score,
        prediction_delta: input.predicted_score - input.current_score,
        accuracy: 0,
        notes: 'Evaluation failed — model could not assess prediction accuracy.',
      }));
    }
  }
}
