/**
 * Sprint 67: Investment Committee Zod Schemas
 */
import { z } from "zod";
import { AGENT_NAMES, AGENT_VOTES } from "./investment-committee.types";

export const AgentVoteOutputSchema = z.object({
  agent_name: z.enum(AGENT_NAMES),
  agent_role: z.string(),
  vote: z.enum(AGENT_VOTES),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  reasoning: z.string(),
});

export const CommitteeVoteContextSchema = z.object({
  opportunity: z.object({
    title: z.string(),
    description: z.string(),
    score: z.number(),
    cluster_size: z.number().nullable(),
    severity: z.number(),
    buying_intent: z.number(),
  }),
  validation: z.object({
    score: z.number(),
    reasoning: z.string(),
  }).nullable().optional(),
  forecast: z.object({
    forecast_score: z.number(),
    growth_rate: z.number(),
    confidence: z.number(),
  }).nullable().optional(),
  venture_score: z.object({
    overall_score: z.number(),
    investment_grade: z.string(),
    recommendation: z.string(),
  }).nullable().optional(),
  financial_model: z.object({
    projected_arr: z.number(),
    break_even_month: z.number(),
    ltv_cac_ratio: z.number(),
    burn_rate: z.number(),
  }).nullable().optional(),
  research: z.object({
    completeness: z.number(),
    sources_count: z.number(),
  }).nullable().optional(),
});

export type AgentVoteOutputSchema = z.infer<typeof AgentVoteOutputSchema>;