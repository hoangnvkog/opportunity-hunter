/**
 * Zod schemas for AI provider responses
 * Provides type-safe validation for GPT/Gemini outputs
 */

import { z } from "zod";

/**
 * Schema for pain point extraction response
 * Used when extracting pain points from raw posts
 */
export const PainPointSchema = z.object({
  pain: z.string(),
  category: z.string(),
  severity: z.number(),
  buying_intent: z.number(),
});

export type PainPointResponse = z.infer<typeof PainPointSchema>;

/**
 * Schema for pain point clustering response
 * Used when grouping similar pain points
 */
export const ClusterSchema = z.object({
  cluster_name: z.string(),
  description: z.string(),
});

export type ClusterResponse = z.infer<typeof ClusterSchema>;

/**
 * Schema for opportunity generation response
 * Used when generating business opportunities from clusters
 */
export const OpportunitySchema = z.object({
  score: z.number(),
  frequency: z.number(),
  severity: z.number(),
  buying_intent: z.number(),
});

export type OpportunityResponse = z.infer<typeof OpportunitySchema>;

/**
 * Schema for startup idea generation response
 * Used when generating startup ideas from opportunities
 */
export const StartupIdeaSchema = z.object({
  problem: z.string(),
  solution: z.string(),
  mvp: z.string(),
  pricing: z.string(),
  customer: z.string(),
  distribution: z.string(),
  competitors: z.string(),
});

export type StartupIdeaResponse = z.infer<typeof StartupIdeaSchema>;
