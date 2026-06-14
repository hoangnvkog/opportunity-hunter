/**
 * AI Provider abstraction layer
 *
 * This module provides a unified interface for different AI/LLM providers.
 * Currently supports: Mock, OpenAI (stub), Gemini (stub)
 */

export type { AIProvider } from "@/types/ai";
export { MockProvider } from "./mock.provider";
export { OpenAIProvider } from "./openai.provider";
export { GeminiProvider } from "./gemini.provider";
export {
  createAIProvider,
  getAIProviderFromEnv,
  type AIProviderType,
  type AIProviderConfig,
} from "./base.provider";
