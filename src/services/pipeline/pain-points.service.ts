/**
 * Pain points service - extracts pain points from raw posts.
 * Currently returns mock data. Ready for LLM integration.
 */

import type { RawPostInput, PainPointInput } from "@/types/pipeline";

/**
 * Extract pain points from raw posts using AI/NLP.
 * TODO: Integrate with LLM (OpenAI, Anthropic, etc.) for intelligent extraction
 */
export async function extractPainPoints(
  posts: RawPostInput[],
): Promise<PainPointInput[]> {
  // Mock implementation - returns sample pain points
  // In production, this would use LLM to extract pain points from post content
  const painPoints: PainPointInput[] = [];

  for (const post of posts) {
    // Mock: generate 1-2 pain points per post
    painPoints.push({
      id: `pain-${post.id}-1`,
      raw_post_id: post.id,
      pain: `Manual process causing errors and inefficiency`,
      category: "Operations",
      severity: 0.8,
      buying_intent: 0.7,
    });

    if (post.score && post.score > 80) {
      painPoints.push({
        id: `pain-${post.id}-2`,
        raw_post_id: post.id,
        pain: `Time-consuming task preventing focus on core business`,
        category: "Productivity",
        severity: 0.9,
        buying_intent: 0.85,
      });
    }
  }

  return painPoints;
}
