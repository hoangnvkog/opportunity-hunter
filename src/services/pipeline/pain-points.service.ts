/**
 * Pain points service - extracts pain points from raw posts.
 * Delegates to AIProvider for intelligent extraction.
 */

import type { AIProvider } from "@/types/ai";
import type { RawPostInput, PainPointInput } from "@/types/pipeline";

/**
 * Extract pain points from raw posts using AI/NLP.
 * 
 * @param posts - Raw posts to analyze
 * @param provider - AI provider to use for extraction
 * @returns Array of extracted pain points
 */
export async function extractPainPoints(
  posts: RawPostInput[],
  provider: AIProvider,
): Promise<PainPointInput[]> {
  return provider.extractPainPoints(posts);
}
