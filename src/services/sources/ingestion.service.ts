/**
 * Multi-source ingestion service
 *
 * Fetches posts from all registered sources with deduplication
 */

import type { RawPostInput } from "@/types/pipeline";
import { getSourceProviders } from "./registry";

/**
 * Fetch posts from all sources
 *
 * Features:
 * - Parallel fetching with Promise.allSettled()
 * - URL-based deduplication
 * - Graceful error handling (one source failure doesn't stop others)
 * - Detailed logging
 */
export async function fetchAllSources(
  limitPerSource = 25
): Promise<RawPostInput[]> {
  console.log(`\n=== Fetching from all sources (${limitPerSource} per source) ===\n`);

  const providers = getSourceProviders();
  console.log(`Registered sources: ${providers.map((p) => p.name).join(", ")}`);

  // Fetch from all sources in parallel
  const results = await Promise.allSettled(
    providers.map((provider) => provider.fetchPosts(limitPerSource))
  );

  // Collect all posts and track failures
  const allPosts: RawPostInput[] = [];
  const failures: string[] = [];

  results.forEach((result, index) => {
    const provider = providers[index];

    if (result.status === "fulfilled") {
      console.log(`✅ ${provider.name}: Fetched ${result.value.length} posts`);
      allPosts.push(...result.value);
    } else {
      console.error(`❌ ${provider.name}: Failed - ${result.reason}`);
      failures.push(provider.name);
    }
  });

  // Deduplicate by URL
  const seenUrls = new Set<string>();
  const uniquePosts: RawPostInput[] = [];
  let duplicateCount = 0;

  for (const post of allPosts) {
    if (!seenUrls.has(post.url)) {
      seenUrls.add(post.url);
      uniquePosts.push(post);
    } else {
      duplicateCount++;
    }
  }

  console.log(`\n=== Ingestion Summary ===`);
  console.log(`Total fetched: ${allPosts.length}`);
  console.log(`Duplicates removed: ${duplicateCount}`);
  console.log(`Unique posts: ${uniquePosts.length}`);
  console.log(`Sources succeeded: ${providers.length - failures.length}/${providers.length}`);

  if (failures.length > 0) {
    console.log(`Sources failed: ${failures.join(", ")}`);
  }

  console.log(`=== End Ingestion ===\n`);

  return uniquePosts;
}
