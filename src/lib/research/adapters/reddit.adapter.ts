/**
 * Sprint 62: Autonomous Research Agent
 *
 * Reddit source adapter for fetching posts from Reddit.
 */

import { BaseResearchSourceAdapter, ResearchSourceAdapter } from "./base.adapter";
import type { ResearchSourceName } from "@/types/research-job";
import type { RawPostRow } from "@/types/database.types";

/**
 * Reddit adapter implementation.
 * Fetches posts from various subreddits related to startups, ideas, etc.
 */
export class RedditAdapter extends BaseResearchSourceAdapter implements ResearchSourceAdapter {
  name: ResearchSourceName = "reddit";

  // Subreddits to monitor (limited to avoid rate limits)
  private subreddits = [
    "startups",
    "Entrepreneur",
    "sideproject",
    "sidehustle",
    "BuildAPC",
    "InternetIsBeautiful",
    "technology",
    "gadgets",
    "Invention",
    "ProductIdeas",
    "venturecapital",
    "angelcandidates",
    "kickstarter",
    "indiegogo",
    "freelance",
    "forhire",
    "jobs",
    "remotejs",
    "wearethemusicmakers",
    "MakeMoneyOnline",
  ];

  constructor() {
    super();
  }

  /**
   * Fetch top posts from the subreddits.
   * Returns an array of RawPostRow objects.
   */
  async collect(): Promise<RawPostRow[]> {
    const posts: RawPostRow[] = [];

    try {
      for (const subreddit of this.subreddits) {
        const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=1&t=day`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'OpportunityHunter/1.0 (by /u/yourusername)',
          }
        });

        if (!response.ok) {
          console.warn(`Reddit request failed for r/${subreddit}: ${response.status}`);
          continue;
        }

        const data = await response.json();

        // Reddit returns an array of posts under data.data.children
        const children = data.data.children;
        if (!children || children.length === 0) {
          continue;
        }

        const post = children[0].data;

        // Skip stickied posts (announcements, rules, etc.)
        if (post.stickied) {
          continue;
        }

        const title = post.title.trim();
        const selftext = post.selftext ?? '';
        const postUrl = post.url.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`;
        // Use the score as the metric (upvotes - downvotes)
        const score = post.score;

        // Prefer the selftext if it's substantial, otherwise use the title
        const content = selftext.length > 50 ? selftext.trim() : title;

        posts.push(this.buildRawPost(
          `reddit:${subreddit}`,
          title,
          content,
          postUrl,
          score
        ));
      }
    } catch (error) {
      console.error('RedditAdapter collection error:', error);
    }

    return posts;
  }

  /**
   * Health check for Reddit API.
   * Try to fetch the front page.
   */
  async health(): Promise<boolean> {
    try {
      const response = await fetch('https://www.reddit.com/.json?limit=1', {
        headers: {
          'User-Agent': 'OpportunityHunter/1.0 (by /u/yourusername)',
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Rate limit for Reddit API.
   * Unauthenticated requests: 60 per minute.
   */
  rateLimit(): number {
    return 60; // requests per minute
  }
}