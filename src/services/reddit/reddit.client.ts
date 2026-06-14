/**
 * Reddit API client for fetching posts from subreddits
 */

import type { RedditListingResponse } from "@/types/reddit";

const REDDIT_BASE_URL = "https://www.reddit.com";
const USER_AGENT = "OpportunityHunter/1.0 (Reddit data analysis tool)";

/**
 * Fetch hot posts from a subreddit
 * @param subreddit - Subreddit name without r/ prefix
 * @param limit - Number of posts to fetch (default: 25, max: 100)
 * @returns Reddit listing response
 */
export async function fetchSubredditPosts(
  subreddit: string,
  limit: number = 25
): Promise<RedditListingResponse> {
  // Sanitize subreddit name (remove r/ if present)
  const cleanSubreddit = subreddit.replace(/^r\//, "");
  
  // Clamp limit between 1 and 100
  const clampedLimit = Math.min(Math.max(1, limit), 100);
  
  const url = `${REDDIT_BASE_URL}/r/${cleanSubreddit}/hot.json?limit=${clampedLimit}`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  
  if (!response.ok) {
    throw new Error(
      `Failed to fetch from Reddit: ${response.status} ${response.statusText}`
    );
  }
  
  const data: RedditListingResponse = await response.json();
  
  return data;
}
