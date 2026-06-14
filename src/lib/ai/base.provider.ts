/**
 * AI Provider utilities and factory
 */

import type { AIProvider } from "@/types/ai";
import { MockProvider } from "./mock.provider";
import { OpenAIProvider } from "./openai.provider";
import { GeminiProvider } from "./gemini.provider";

/**
 * Supported AI provider types
 */
export type AIProviderType = "mock" | "openai" | "gemini";

/**
 * Configuration for AI providers
 */
export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  model?: string;
}

/**
 * Factory function to create AI provider instances
 *
 * @param config - Provider configuration
 * @returns AIProvider instance
 *
 * @example
 * ```typescript
 * // Use mock provider for development/testing
 * const provider = createAIProvider({ type: 'mock' });
 *
 * // Use OpenAI provider (requires API key)
 * const provider = createAIProvider({
 *   type: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: 'gpt-4o-mini'
 * });
 *
 * // Use Gemini provider (requires API key)
 * const provider = createAIProvider({
 *   type: 'gemini',
 *   apiKey: process.env.GEMINI_API_KEY,
 *   model: 'gemini-1.5-flash'
 * });
 * ```
 */
export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case "mock":
      return new MockProvider();

    case "openai":
      return new OpenAIProvider(config.apiKey, config.model);

    case "gemini":
      return new GeminiProvider(config.apiKey, config.model);

    default:
      throw new Error(`Unknown AI provider type: ${config.type}`);
  }
}

/**
 * Get AI provider from environment variables
 * Reads AI_PROVIDER, OPENAI_API_KEY, GEMINI_API_KEY from process.env
 *
 * @returns AIProvider instance based on environment configuration
 *
 * @example
 * ```typescript
 * // Set in .env.local:
 * // AI_PROVIDER=openai
 * // OPENAI_API_KEY=sk-...
 *
 * const provider = getAIProviderFromEnv();
 * ```
 */
export function getAIProviderFromEnv(): AIProvider {
  const providerType = (process.env.AI_PROVIDER || "mock") as AIProviderType;

  const config: AIProviderConfig = {
    type: providerType,
  };

  if (providerType === "openai") {
    config.apiKey = process.env.OPENAI_API_KEY;
    config.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  } else if (providerType === "gemini") {
    config.apiKey = process.env.GEMINI_API_KEY;
    config.model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  return createAIProvider(config);
}
