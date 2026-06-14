/**
 * Reddit service for ingesting posts into the database
 */

import { RawPostsRepository } from "@/lib/db/repositories";
import { fetchSubredditPosts } from "./reddit.client";
import type { RedditPost } from "@/types/reddit";
import type { RawPostInsert } from "@/types";

/**
 * Convert a Reddit post to RawPostInsert format
 */
function transformRedditPost(post: RedditPost): RawPostInsert {
  const { data } = post;
  
  return {
    source: `Reddit - r/${data.subreddit}`,
    title: data.title,
    content: data.selftext || data.title, // Use title if no selftext
    url: `https://reddit.com${data.permalink}`,
    score: data.score,
  };
}

/**
 * Ingest posts from a subreddit into the database
 * @param subreddit - Subreddit name (with or without r/ prefix)
 * @param limit - Number of posts to fetch (default: 25)
 * @returns Object with counts of fetched, skipped (duplicates), and inserted posts
 */
export async function ingestSubreddit(
  subreddit: string,
  limit: number = 25
): Promise<{
  fetched: number;
  skipped: number;
  inserted: number;
}> {
  // Fetch posts from Reddit
  const response = await fetchSubredditPosts(subreddit, limit);
  const posts = response.data.children;
  
  if (posts.length === 0) {
    return { fetched: 0, skipped: 0, inserted: 0 };
  }
  
  // Transform posts to RawPostInsert format
  const transformedPosts = posts.map(transformRedditPost);
  
  // Get repository instance
  const repository = await RawPostsRepository.create();
  
  // Check for existing URLs to prevent duplicates
  const existingPosts = await repository.list({ limit: 1000 });
  const existingUrls = new Set(existingPosts.map(post => post.url));
  
  // Filter out duplicates
  const newPosts = transformedPosts.filter(
    post => !existingUrls.has(post.url)
  );
  
  const skipped = transformedPosts.length - newPosts.length;
  
  // Insert new posts
  let inserted = 0;
  if (newPosts.length > 0) {
    const result = await repository.createMany(newPosts);
    inserted = result.length;
  }
  
  return {
    fetched: posts.length,
    skipped,
    inserted,
  };
}
