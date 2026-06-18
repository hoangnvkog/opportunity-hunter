/**
 * Pain points service - extracts pain points from raw posts.
 * Delegates to AIProvider for intelligent extraction.
 */

import type { AIProvider } from "@/types/ai";
import type { RawPostInput, PainPointInput } from "@/types/pipeline";
import type { RawPostRow, PainPointInsert } from "@/types";
import { RawPostsRepository, PainPointsRepository } from "@/lib/db/repositories";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";

/**
 * Convert RawPostRow to RawPostInput for AI provider
 */
function toRawPostInput(row: RawPostRow): RawPostInput {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    content: row.content,
    url: row.url,
    score: row.score,
    created_at: row.created_at,
  };
}

/**
 * Convert PainPointInput to PainPointInsert for database
 */
function toPainPointInsert(input: PainPointInput): PainPointInsert {
  return {
    description: input.pain,
    severity: input.severity.toString(),
    buying_intent: input.buying_intent.toString(),
  };
}

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

/**
 * Extract pain points from raw_posts in database and insert into pain_points.
 * Uses AI provider from environment (default: MockProvider).
 * Skips duplicates by checking description content.
 * 
 * @param limit - Maximum number of raw posts to process (default: 50)
 * @returns Object with counts: processed, extracted, skipped, inserted
 */
export async function extractPainPointsFromPosts(
  limit: number = 50,
): Promise<{
  processed: number;
  extracted: number;
  skipped: number;
  inserted: number;
}> {
  // Get repositories
  const rawPostsRepo = await RawPostsRepository.create();
  const painPointsRepo = await PainPointsRepository.create();
  
  // Load raw posts from database
  const rawPosts = await rawPostsRepo.list({ limit });
  
  if (rawPosts.length === 0) {
    return { processed: 0, extracted: 0, skipped: 0, inserted: 0 };
  }
  
  // Convert to RawPostInput for AI provider
  const postsInput = rawPosts.map(toRawPostInput);
  
  // Get AI provider from environment (default: MockProvider)
  const provider = getAIProviderFromEnv();
  
  // Extract pain points using AI
  const extractedPoints = await provider.extractPainPoints(postsInput);
  
  if (extractedPoints.length === 0) {
    return { processed: rawPosts.length, extracted: 0, skipped: 0, inserted: 0 };
  }
  
  // Load existing pain points to detect duplicates
  const existingPoints = await painPointsRepo.list({ limit: 1000 });
  const existingKeys = new Set(
    existingPoints.map(p => p.description.toLowerCase())
  );
  
  // Filter out duplicates and convert to insert format
  const newPoints = extractedPoints
    .filter(point => !existingKeys.has(point.pain.toLowerCase()))
    .map(toPainPointInsert);
  
  const skipped = extractedPoints.length - newPoints.length;
  
  // Insert new pain points
  let inserted = 0;
  if (newPoints.length > 0) {
    const result = await painPointsRepo.createMany(newPoints);
    inserted = result.length;
  }
  
  return {
    processed: rawPosts.length,
    extracted: extractedPoints.length,
    skipped,
    inserted,
  };
}
