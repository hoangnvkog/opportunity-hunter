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
import { randomUUID } from "crypto";

import type { AIProvider } from "@/types/ai";
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
      const parsed = JSON.parse(content);

      result.push({
        id: randomUUID(),
        raw_post_id: post.id,
        pain: parsed.pain,
        category: parsed.category,
        severity: parsed.severity,
        buying_intent: parsed.buying_intent,
      });
    } catch {
      result.push({
        id: randomUUID(),
        raw_post_id: post.id,
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
  const clusters: PainClusterInput[] = [];

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
      const parsed = JSON.parse(content);

      clusters.push({
        id: randomUUID(),
        cluster_name: parsed.cluster_name,
        description: parsed.description,
        pain_point_ids: [painPoint.id],
      });
    } catch {
      clusters.push({
        id: randomUUID(),
        cluster_name: "General",
        description: painPoint.pain,
        pain_point_ids: [painPoint.id],
      });
    }
  }

  return clusters;
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
      const parsed = JSON.parse(content);

      opportunities.push({
  id: randomUUID(),
  cluster_id: cluster.id,

  score: parsed.score,
  frequency: parsed.frequency,
  severity: parsed.severity,
  buying_intent: parsed.buying_intent,

  cluster_name: cluster.cluster_name,
  cluster_description: cluster.description,
});
    } catch {
      opportunities.push({
  id: randomUUID(),
  cluster_id: cluster.id,

  score: 50,
  frequency: 1,
  severity: 0.5,
  buying_intent: 0.5,

  cluster_name: cluster.cluster_name,
  cluster_description: cluster.description,
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
`
        },
        {
          role: "user",
          content: `
Cluster:

${opportunity.cluster_name}

Description:

${opportunity.cluster_description}

Opportunity score:

${opportunity.score}

Frequency:

${opportunity.frequency}

Severity:

${opportunity.severity}

Buying intent:

${opportunity.buying_intent}
`
        }
      ]
    });

    try {

      const content =
        response.choices[0].message.content ?? "{}";

      const parsed = JSON.parse(content);

      ideas.push({
        id: randomUUID(),
        opportunity_id: opportunity.id,

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
        id: randomUUID(),
        opportunity_id: opportunity.id,

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
