/**
 * Sprint 67: Investment Committee Runner
 *
 * Runs all 5 agents in parallel using the AI provider.
 * Each agent gets its own independent request.
 * Results are aggregated by the service layer.
 */
import type { AgentVoteOutput, AgentVoteContext } from "./investment-committee.types";
import { AGENT_PROFILES } from "./investment-committee.types";
import { getAgentPrompt } from "./investment-committee.prompts";
import { AgentVoteOutputSchema } from "./investment-committee.schemas";
import { DEFAULT_PROS, DEFAULT_CONS } from "./investment-committee.constants";

// ---------------------------------------------------------------------------
// Runner result type
// ---------------------------------------------------------------------------

export interface CommitteeRunnerResult {
  votes: AgentVoteOutput[];
  errors: string[];
}

// ---------------------------------------------------------------------------
// Run a single agent and parse its response
// ---------------------------------------------------------------------------

async function runAgent(
  agent: (typeof AGENT_PROFILES)[number],
  ctx: AgentVoteContext,
  callAI: (system: string, user: string) => Promise<unknown>,
): Promise<AgentVoteOutput | null> {
  const prompt = getAgentPrompt(agent.name, ctx);
  try {
    const raw = await callAI(
      "You are an expert venture capital analyst. Return ONLY a JSON object matching this exact schema. No markdown, no code fences: {\"vote\": \"BUY\"|\"WATCH\"|\"PASS\", \"score\": 0-100, \"confidence\": 0-100, \"pros\": string[], \"cons\": string[], \"reasoning\": string}.",
      prompt,
    );
    const parsed = AgentVoteOutputSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`[committee-runner] ${agent.name}: parse failed`, parsed.error.flatten());
      return null;
    }
    return { ...parsed.data, agent_name: agent.name, agent_role: agent.role };
  } catch (err) {
    console.error(`[committee-runner] ${agent.name}: ${err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fallback vote for a failed agent
// ---------------------------------------------------------------------------

function fallbackVote(agent: (typeof AGENT_PROFILES)[number]): AgentVoteOutput {
  return {
    agent_name: agent.name,
    agent_role: agent.role,
    vote: "WATCH",
    score: 50,
    confidence: 0,
    pros: DEFAULT_PROS.slice(0, 3),
    cons: DEFAULT_CONS.slice(0, 3),
    reasoning: "Agent evaluation failed — using neutral fallback.",
  };
}

// ---------------------------------------------------------------------------
// Main runner: run all 5 agents in parallel
// ---------------------------------------------------------------------------

export async function runCommittee(
  ctx: AgentVoteContext,
  callAI: (system: string, user: string) => Promise<unknown>,
): Promise<CommitteeRunnerResult> {
  const errors: string[] = [];

  const results = await Promise.all(
    AGENT_PROFILES.map(async (agent) => {
      const result = await runAgent(agent, ctx, callAI);
      if (!result) {
        errors.push(`${agent.name} failed`);
        return fallbackVote(agent);
      }
      return result;
    }),
  );

  return { votes: results, errors };
}

// ---------------------------------------------------------------------------
// Batch runner: run all 5 agents in a SINGLE AI request
// (More token-efficient but agents may influence each other)
// ---------------------------------------------------------------------------

export async function runCommitteeBatch(
  ctx: AgentVoteContext,
  callAI: (system: string, user: string) => Promise<unknown>,
): Promise<CommitteeRunnerResult> {
  const errors: string[] = [];
  const batchPrompt = `You are an AI Investment Committee. Five independent partners evaluate the startup.

Return ONLY a JSON array with 5 objects. No markdown, no code fences.

[
  {
    "agent_name": "MARKET_ANALYST",
    "agent_role": "Market Analyst",
    "vote": "BUY" | "WATCH" | "PASS",
    "score": number,
    "confidence": number,
    "pros": string[],
    "cons": string[],
    "reasoning": string
  },
  {
    "agent_name": "PRODUCT_PARTNER",
    "agent_role": "Product Partner",
    "vote": "BUY" | "WATCH" | "PASS",
    "score": number,
    "confidence": number,
    "pros": string[],
    "cons": string[],
    "reasoning": string
  },
  {
    "agent_name": "FINANCIAL_PARTNER",
    "agent_role": "Financial Partner",
    "vote": "BUY" | "WATCH" | "PASS",
    "score": number,
    "confidence": number,
    "pros": string[],
    "cons": string[],
    "reasoning": string
  },
  {
    "agent_name": "TECHNICAL_PARTNER",
    "agent_role": "Technical Partner",
    "vote": "BUY" | "WATCH" | "PASS",
    "score": number,
    "confidence": number,
    "pros": string[],
    "cons": string[],
    "reasoning": string
  },
  {
    "agent_name": "VC_PARTNER",
    "agent_role": "VC Partner",
    "vote": "BUY" | "WATCH" | "PASS",
    "score": number,
    "confidence": number,
    "pros": string[],
    "cons": string[],
    "reasoning": string
  }
]

OPPORTUNITY:
${ctx.opportunity.title}
${ctx.opportunity.description}
Score: ${ctx.opportunity.score}/100 | Severity: ${(ctx.opportunity.severity * 100).toFixed(0)}% | Buying Intent: ${(ctx.opportunity.buying_intent * 100).toFixed(0)}%
${ctx.validation ? `Validation: ${ctx.validation.score}/100 — ${ctx.validation.reasoning}` : ""}
${ctx.venture_score ? `Venture Score: ${ctx.venture_score.overall_score}/100 (${ctx.venture_score.investment_grade})` : ""}
${ctx.financial_model ? `Financial: ARR $${ctx.financial_model.projected_arr.toLocaleString()}, LTV/CAC ${ctx.financial_model.ltv_cac_ratio}x, Break-even Mo ${ctx.financial_model.break_even_month}` : ""}
${ctx.forecast ? `Forecast: ${(ctx.forecast.growth_rate * 100).toFixed(1)}%/yr growth, confidence ${ctx.forecast.confidence}%` : ""}
${ctx.research ? `Research: ${ctx.research.completeness}% complete, ${ctx.research.sources_count} sources` : ""}`;

  try {
    const raw = await callAI(
      "Return ONLY a JSON array. No markdown, no text, no code fences.",
      batchPrompt,
    );

    const arr = Array.isArray(raw) ? raw : [];
    const votes: AgentVoteOutput[] = [];

    for (let i = 0; i < AGENT_PROFILES.length; i++) {
      const agent = AGENT_PROFILES[i];
      const rawVote = arr[i];
      const parsed = AgentVoteOutputSchema.safeParse(rawVote);
      if (!parsed.success) {
        errors.push(`${agent.name} parse failed`);
        votes.push(fallbackVote(agent));
      } else {
        votes.push({ ...parsed.data, agent_name: agent.name, agent_role: agent.role });
      }
    }

    return { votes, errors };
  } catch (err) {
    console.error("[committee-runner] batch failed:", err);
    errors.push("Batch request failed");
    return {
      votes: AGENT_PROFILES.map(fallbackVote),
      errors,
    };
  }
}