/**
 * OpenAI Provider - stub implementation
 * TODO: Implement with OpenAI SDK (openai) when ready
 *
 * This provider will use OpenAI's GPT models for:
 * - Pain point extraction from raw posts
 * - Semantic clustering of pain points
 * - Opportunity scoring and generation
 * - Startup idea generation
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

  /**
   * Extract pain points using OpenAI GPT
   */
  async extractPainPoints(posts: RawPostInput[]): Promise<PainPointInput[]> {
    const result: PainPointInput[] = [];

    for (const post of posts) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `
        Extract one business pain point.

        Return ONLY valid JSON:

        {
          "pain": "string",
          "category": "string",
          "severity": number,
          "buying_intent": number
        }

        severity and buying_intent must be between 0 and 1.
        `,
          },
          {
            role: "user",
            content: `${post.title}\n\n${post.content}`,
          },
        ],
      });

      const content =
        response.choices[0]?.message?.content?.trim() ?? "";

      try {
        const parsed = PainPointSchema.parse(JSON.parse(content));

        result.push({
          pain: parsed.pain,
          category: parsed.category,
          severity: parsed.severity,
          buying_intent: parsed.buying_intent,
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

    return result;
  }

  /**
   * Cluster pain points using OpenAI embeddings or GPT
   */
  async clusterPainPoints(
    painPoints: PainPointInput[],
  ): Promise<PainClusterInput[]> {
    const clusters = new Map<string, PainClusterInput>();

    for (const painPoint of painPoints) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `
Group this pain point into a business cluster.

Return ONLY valid JSON:

{
  "cluster_name": "string",
  "description": "string"
}
`,
          },
          {
            role: "user",
            content: painPoint.pain,
          },
        ],
      });

      const content =
        response.choices[0]?.message?.content?.trim() ?? "";

      try {
        const parsed = ClusterSchema.parse(JSON.parse(content));
        const clusterName = parsed.cluster_name;
        
        if (!clusters.has(clusterName)) {
          clusters.set(clusterName, {
            cluster_name: parsed.cluster_name,
            description: parsed.description,
          });
        }
      } catch {
        if (!clusters.has("general")) {
          clusters.set("general", {
            cluster_name: "general",
            description: "General cluster",
          });
        }
      }
    }

    return Array.from(clusters.values());
  }

  /**
   * Generate opportunities using OpenAI GPT
   */
  async generateOpportunities(
    clusters: PainClusterInput[],
  ): Promise<OpportunityInput[]> {
    const opportunities: OpportunityInput[] = [];

    for (const cluster of clusters) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `
Analyze this business pain cluster.

Return ONLY valid JSON:

{
  "title": "string (optional)",
  "description": "string (optional)",
  "score": number,
  "frequency": number,
  "severity": number,
  "buying_intent": number
}

score: 0-100
frequency: integer
severity: 0-1
buying_intent: 0-1
`,
          },
          {
            role: "user",
            content: `
Cluster name: ${cluster.cluster_name}

Description:
${cluster.description}
`,
          },
        ],
      });

      const content =
        response.choices[0]?.message?.content?.trim() ?? "";

      try {
        const parsed = OpportunitySchema.parse(JSON.parse(content));

        opportunities.push({
          cluster_id: cluster.cluster_name, // Will be replaced by real UUID after insert
          title: parsed.title || `${cluster.cluster_name} Solution`,
          description: parsed.description || `AI-generated opportunity addressing: ${cluster.description}`,
          score: parsed.score,
          frequency: parsed.frequency,
          severity: parsed.severity,
          buying_intent: parsed.buying_intent,
        });
      } catch {
        opportunities.push({
          cluster_id: cluster.cluster_name,
          title: `${cluster.cluster_name} Solution`,
          description: `AI-generated opportunity addressing: ${cluster.description}`,
          score: 50,
          frequency: 1,
          severity: 0.5,
          buying_intent: 0.5,
        });
      }
    }

    return opportunities;
  }

  /**
   * Generate startup ideas using OpenAI GPT
   */
  async generateStartupIdeas(
    opportunities: OpportunityInput[],
  ): Promise<StartupIdeaInput[]> {
    const ideas: StartupIdeaInput[] = [];

    for (const opportunity of opportunities) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `
You are a startup founder.

Given a business opportunity, Generate:

- problem
- solution
- mvp
- pricing
- customer
- distribution
- competitors

Return ONLY valid JSON.

Example:

{
  "problem":"...",
  "solution":"...",
  "mvp":"...",
  "pricing":"...",
  "customer":"...",
  "distribution":"...",
  "competitors":"..."
}
`,
          },
          {
            role: "user",
            content: `
Title: ${opportunity.title}
Description: ${opportunity.description}
Score: ${opportunity.score}
Frequency: ${opportunity.frequency}
Severity: ${opportunity.severity}
Buying intent: ${opportunity.buying_intent}
`,
          },
        ],
      });

      try {
        const content =
          response.choices[0].message.content ?? "{}";

        const parsed = StartupIdeaSchema.parse(JSON.parse(content));

        ideas.push({
          opportunity_id: opportunity.cluster_id, // Will be replaced by real UUID after insert
          problem: parsed.problem,
          solution: parsed.solution,
          mvp: parsed.mvp,
          pricing: parsed.pricing,
          customer: parsed.customer,
          distribution: parsed.distribution,
          competitors: parsed.competitors,
        });
      } catch {
        ideas.push({
          opportunity_id: opportunity.cluster_id,
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

    return ideas;
  }
}