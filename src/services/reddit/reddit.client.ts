/**
 * Reddit API client for fetching posts from subreddits
 */

import type { RedditListingResponse } from "@/types/reddit";

const REDDIT_BASE_URL = "https://api.reddit.com";
const USER_AGENT = "OpportunityHunter/1.0 (contact: admin@example.com)";

/**
 * Fetch hot posts from a subreddit
 * @param subreddit - Subreddit name without r/ prefix
 * @param limit - Number of posts to fetch (default: 25, max: 100)
 * @returns Reddit listing response, or null if fetch fails
 */
export async function fetchSubredditPosts(
  subreddit: string,
  limit: number = 25
): Promise<RedditListingResponse | null> {
  // Sanitize subreddit name (remove r/ if present)
  const cleanSubreddit = subreddit.replace(/^r\//, "");
  
  // Clamp limit between 1 and 100
  const clampedLimit = Math.min(Math.max(1, limit), 100);
  
  const url = `${REDDIT_BASE_URL}/r/${cleanSubreddit}/hot?limit=${clampedLimit}`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  
  if (!response.ok) {
    console.warn(
      `Reddit fetch failed: ${response.status} ${response.statusText}`
    );
    return null;
  }
  
  let data: RedditListingResponse;
  try {
    data = await response.json();
  } catch {
    console.warn("Reddit fetch failed: invalid JSON in response");
    return null;
  }
  
  // Validate response structure
  if (!data?.data?.children) {
    console.warn(
      "Reddit fetch failed: malformed response (missing data.children)"
    );
    return null;
  }
  
  return data;
}
