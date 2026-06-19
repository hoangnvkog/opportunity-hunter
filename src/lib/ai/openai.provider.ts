/**
 * OpenAI Provider - uses GPT models for AI-powered pipeline stages.
 * Optimized with batch processing to reduce API calls by ~90%.
 */
import OpenAI from "openai";

import type { AIProvider } from "@/types/ai";
import {
  PainPointSchema,
  ClusterSchema,
  OpportunitySchema,
  StartupIdeaSchema,
} from "./schemas";
import type {
  RawPostInput,
  PainPointInput,
  PainClusterInput,
  OpportunityInput,
  StartupIdeaInput,
} from "@/types/pipeline";
import { splitIntoChunks } from "@/lib/utils/chunk";

const BATCH_SIZE = 10;

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
    const result: PainPointInput[] = [];
    const chunks = splitIntoChunks(posts, BATCH_SIZE);

    for (const chunk of chunks) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: "system",
              content: `
You will receive an array of Reddit posts.
Extract one business pain point for each post.

Return ONLY a valid JSON array with exactly ${chunk.length} objects:

[
  {
    "pain": "string",
    "category": "string",
    "severity": number,
    "buying_intent": number
  }
]

severity and buying_intent must be between 0 and 1.
Return exactly ${chunk.length} objects, one for each post.
`,
            },
            {
              role: "user",
              content: JSON.stringify(
                chunk.map((post) => ({
                  title: post.title,
                  content: post.content,
                })),
              ),
            },
          ],
        });

        const content = response.choices[0]?.message?.content?.trim() ?? "";
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            try {
              const validated = PainPointSchema.parse(item);
              result.push({
                pain: validated.pain,
                category: validated.category,
                severity: validated.severity,
                buying_intent: validated.buying_intent,
              });
            } catch {
              result.push({
                pain: "Unknown pain point",
                category: "general",
                severity: 0.5,
                buying_intent: 0.5,
              });
            }
          }
        } else {
          // Response is not an array, add fallbacks for all items in chunk
          for (let i = 0; i < chunk.length; i++) {
            result.push({
              pain: "Unknown pain point",
              category: "general",
              severity: 0.5,
              buying_intent: 0.5,
            });
          }
        }
      } catch (error) {
        console.error("Batch extractPainPoints failed:", error);
        // Add fallbacks for all items in chunk
        for (let i = 0; i < chunk.length; i++) {
          result.push({
            pain: "Unknown pain point",
            category: "general",
            severity: 0.5,
            buying_intent: 0.5,
          });
        }
      }
    }

    return result;
  }

  async clusterPainPoints(painPoints: PainPointInput[]): Promise<PainClusterInput[]> {
    const clusterMap = new Map<string, { name: string; description: string; indexes: number[] }>();
    const chunks = splitIntoChunks(painPoints, BATCH_SIZE);
    let globalIndex = 0;

    for (const chunk of chunks) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: "system",
              content: `
You will receive an array of pain points.
Group them into business clusters.

Return ONLY a valid JSON array:

[
  {
    "cluster_name": "string",
    "description": "string"
  }
]

Each pain point should be assigned to a cluster.
Similar pain points should be in the same cluster.
`,
            },
            {
              role: "user",
              content: JSON.stringify(
                chunk.map((pp) => ({
                  pain: pp.pain,
                  category: pp.category,
                })),
              ),
            },
          ],
        });

        const content = response.choices[0]?.message?.content?.trim() ?? "";
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            try {
              const validated = ClusterSchema.parse(item);
              const name = validated.cluster_name;
              if (!clusterMap.has(name)) {
                clusterMap.set(name, { name, description: validated.description, indexes: [] });
              }
              // Assign current pain point to this cluster
              clusterMap.get(name)!.indexes.push(globalIndex);
              globalIndex++;
            } catch {
              const name = "general";
              if (!clusterMap.has(name)) {
                clusterMap.set(name, { name, description: "General cluster", indexes: [] });
              }
              clusterMap.get(name)!.indexes.push(globalIndex);
              globalIndex++;
            }
          }
        } else {
          // Response is not an array, add all items to general cluster
          const name = "general";
          if (!clusterMap.has(name)) {
            clusterMap.set(name, { name, description: "General cluster", indexes: [] });
          }
          for (let i = 0; i < chunk.length; i++) {
            clusterMap.get(name)!.indexes.push(globalIndex);
            globalIndex++;
          }
        }
      } catch (error) {
        console.error("Batch clusterPainPoints failed:", error);
        // Add all items in chunk to general cluster
        const name = "general";
        if (!clusterMap.has(name)) {
          clusterMap.set(name, { name, description: "General cluster", indexes: [] });
        }
        for (let i = 0; i < chunk.length; i++) {
          clusterMap.get(name)!.indexes.push(globalIndex);
          globalIndex++;
        }
      }
    }

    return Array.from(clusterMap.values()).map((c) => ({
      cluster_name: c.name,
      description: c.description,
      pain_point_indexes: c.indexes,
    }));
  }

  async generateOpportunities(clusters: PainClusterInput[]): Promise<OpportunityInput[]> {
    const opportunities: OpportunityInput[] = [];
    const chunks = splitIntoChunks(clusters, BATCH_SIZE);

    for (const chunk of chunks) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: "system",
              content: `
You will receive an array of pain clusters.
Analyze each cluster and return one opportunity for each.

Return ONLY a valid JSON array with exactly ${chunk.length} objects:

[
  {
    "score": number,
    "frequency": number,
    "severity": number,
    "buying_intent": number
  }
]

score: 0-100
frequency: integer
severity: 0-1
buying_intent: 0-1

Return exactly ${chunk.length} objects, one for each cluster.
`,
            },
            {
              role: "user",
              content: JSON.stringify(
                chunk.map((cluster) => ({
                  cluster_name: cluster.cluster_name,
                  description: cluster.description,
                })),
              ),
            },
          ],
        });

        const content = response.choices[0]?.message?.content?.trim() ?? "";
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            const cluster = chunk[i];
            try {
              const validated = OpportunitySchema.parse(item);
              opportunities.push({
                score: validated.score,
                frequency: validated.frequency,
                severity: validated.severity,
                buying_intent: validated.buying_intent,
                cluster_name: cluster?.cluster_name,
                cluster_description: cluster?.description,
              });
            } catch {
              opportunities.push({
                score: 50,
                frequency: 1,
                severity: 0.5,
                buying_intent: 0.5,
                cluster_name: cluster?.cluster_name,
                cluster_description: cluster?.description,
              });
            }
          }
        } else {
          // Response is not an array, add fallbacks for all items in chunk
          for (const cluster of chunk) {
            opportunities.push({
              score: 50,
              frequency: 1,
              severity: 0.5,
              buying_intent: 0.5,
              cluster_name: cluster.cluster_name,
              cluster_description: cluster.description,
            });
          }
        }
      } catch (error) {
        console.error("Batch generateOpportunities failed:", error);
        // Add fallbacks for all items in chunk
        for (const cluster of chunk) {
          opportunities.push({
            score: 50,
            frequency: 1,
            severity: 0.5,
            buying_intent: 0.5,
            cluster_name: cluster.cluster_name,
            cluster_description: cluster.description,
          });
        }
      }
    }

    return opportunities;
  }

  async generateStartupIdeas(opportunities: OpportunityInput[]): Promise<StartupIdeaInput[]> {
    const ideas: StartupIdeaInput[] = [];
    const chunks = splitIntoChunks(opportunities, BATCH_SIZE);

    for (const chunk of chunks) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: "system",
              content: `
You are a startup founder.
You will receive an array of business opportunities.
Generate one startup idea for each opportunity.

Return ONLY a valid JSON array with exactly ${chunk.length} objects:

[
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

Return exactly ${chunk.length} objects, one for each opportunity.
`,
            },
            {
              role: "user",
              content: JSON.stringify(
                chunk.map((opp) => ({
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

        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            try {
              const validated = StartupIdeaSchema.parse(item);
              ideas.push({
                problem: validated.problem,
                solution: validated.solution,
                mvp: validated.mvp,
                pricing: validated.pricing,
                customer: validated.customer,
                distribution: validated.distribution,
                competitors: validated.competitors,
              });
            } catch {
              ideas.push({
                problem: "Unknown problem",
                solution: "Unknown solution",
                mvp: "Basic MVP",
                pricing: "$29/month",
                customer: "Small businesses",
                distribution: "SEO + Content Marketing",
                competitors: "Existing SaaS tools",
              });
            }
          }
        } else {
          // Response is not an array, add fallbacks for all items in chunk
          for (let i = 0; i < chunk.length; i++) {
            ideas.push({
              problem: "Unknown problem",
              solution: "Unknown solution",
              mvp: "Basic MVP",
              pricing: "$29/month",
              customer: "Small businesses",
              distribution: "SEO + Content Marketing",
              competitors: "Existing SaaS tools",
            });
          }
        }
      } catch (error) {
        console.error("Batch generateStartupIdeas failed:", error);
        // Add fallbacks for all items in chunk
        for (let i = 0; i < chunk.length; i++) {
          ideas.push({
            problem: "Unknown problem",
            solution: "Unknown solution",
            mvp: "Basic MVP",
            pricing: "$29/month",
            customer: "Small businesses",
            distribution: "SEO + Content Marketing",
            competitors: "Existing SaaS tools",
          });
        }
      }
    }

    return ideas;
  }
}
