/**
 * AI Usage logging utility.
 * Logs every AI API call to the ai_usage_logs table.
 * Called from AI providers after each request.
 *
 * Token pricing (per 1M tokens):
 *   GPT-4o-mini: $0.15 input / $0.60 output
 *   text-embedding-3-small: $0.02
 */
import { AiUsageRepository } from "@/lib/db/repositories/ai-usage.repository";
import type { AiProvider } from "@/types/admin";

// Cost per million tokens
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "text-embedding-3-small": { input: 0.02, output: 0.0 },
  "text-embedding-3-large": { input: 0.13, output: 0.0 },
};

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const costs = MODEL_COSTS[model] ?? { input: 0.15, output: 0.60 };
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}

export async function logAiUsage(opts: {
  userId?: string | null;
  provider: AiProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  const { inputTokens, outputTokens, provider, model, userId } = opts;
  const estimatedCost = estimateCost(model, inputTokens, outputTokens);

  try {
    const repo = await AiUsageRepository.create();
    await repo.insert({
      user_id: userId ?? null,
      provider,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: estimatedCost,
    });
  } catch (err) {
    console.error("Failed to log AI usage:", err);
  }
}

export async function logAiUsageFromResponse(opts: {
  provider: AiProvider;
  model: string;
  userId?: string | null;
  usage: { prompt_tokens: number; completion_tokens: number };
}): Promise<void> {
  await logAiUsage({
    provider: opts.provider,
    model: opts.model,
    userId: opts.userId,
    inputTokens: opts.usage.prompt_tokens,
    outputTokens: opts.usage.completion_tokens,
  });
}