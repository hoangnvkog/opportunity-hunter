import { RawPostsRepository } from "@/lib/db/repositories/raw-posts.repository";
import { PainPointsRepository } from "@/lib/db/repositories/pain-points.repository";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";
import type { RawPostInput, PainPointInput } from "@/types/pipeline";

/**
 * Extract pain points from unprocessed raw posts
 * Uses incremental processing: only processes posts where processed = false
 */
export async function extractPainPointsFromPosts(limit = 50): Promise<{
  processed: number;
  extracted: number;
  inserted: number;
}> {
  const rawPostsRepo = await RawPostsRepository.create();
  const painPointsRepo = await PainPointsRepository.create();

  // Fetch only unprocessed posts
  const unprocessedPosts = await rawPostsRepo.listUnprocessed(limit);

  if (unprocessedPosts.length === 0) {
    return { processed: 0, extracted: 0, inserted: 0 };
  }

  const provider = getAIProviderFromEnv();
  const processedPostIds: string[] = [];
  let totalExtracted = 0;
  let totalInserted = 0;

  // Process each post individually
  for (const post of unprocessedPosts) {
    try {
      // Convert to pipeline input
      const input: RawPostInput = {
        source: post.source,
        title: post.title,
        content: post.content,
        url: post.url,
        score: post.score,
        created_at: post.created_at,
      };

      // Extract pain points using AI
      const painPoints: PainPointInput[] = await provider.extractPainPoints([input]);
      totalExtracted += painPoints.length;

      // Insert pain points
      if (painPoints.length > 0) {
        for (const painPoint of painPoints) {
          try {
            await painPointsRepo.create({
              raw_post_id: post.id,
              description: painPoint.pain,
              category: painPoint.category,
              severity: Math.round(painPoint.severity * 100),
              buying_intent: painPoint.buying_intent.toFixed(3),
            });
            totalInserted++;
          } catch (error) {
            console.error(`Failed to insert pain point for post ${post.id}:`, error);
          }
        }
      }

      // Mark post as processed
      await rawPostsRepo.markProcessed(post.id);
      processedPostIds.push(post.id);
    } catch (error) {
      console.error(`Failed to process post ${post.id}:`, error);
    }
  }

  return {
    processed: processedPostIds.length,
    extracted: totalExtracted,
    inserted: totalInserted,
  };
}
