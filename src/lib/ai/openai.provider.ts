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
} from "./schemas";
import type {
  RawPostInput,
  PainPointInput,
  PainClusterInput,
  OpportunityInput,
  StartupIdeaInput,
} from "@/types/pipeline";
import type { OpportunityInsightInput } from "@/types/opportunity-insight";

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
}
