/**
 * Sprint 62: Autonomous Research Agent
 *
 * HackerNews source adapter for fetching posts from Hacker News.
 */

import { BaseResearchSourceAdapter, ResearchSourceAdapter } from "./base.adapter";
import type { ResearchSourceName } from "@/types/research-job";
import type { RawPostRow } from "@/types/database.types";

/**
 * HackerNews adapter implementation.
 * Fetches stories from Hacker News using the Firebase API.
 */
export class HackerNewsAdapter extends BaseResearchSourceAdapter implements ResearchSourceAdapter {
  name: ResearchSourceName = "hackernews";

  // We'll fetch from the 'newest' and 'ask' and 'show' sections to get a variety.
  // But note: the HN API doesn't support filtering by topic easily.
  // We'll use the top stories and then filter by keywords? For simplicity, we take the top stories.
  // Alternatively, we can use the Algolia API which allows search, but let's stick to the official API for now.
  // We'll get the top 100 stories and then process them.

  constructor() {
    super();
  }

  /**
   * Fetch stories from Hacker News.
   * Returns an array of RawPostRow objects.
   */
  async collect(): Promise<RawPostRow[]> {
    const posts: RawPostRow[] = [];

    try {
      // First, get the list of top story IDs
      const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      if (!topStoriesResponse.ok) {
        throw new Error(`Failed to fetch top stories: ${topStoriesResponse.status}`);
      }
      const storyIds = await topStoriesResponse.json();

      // We'll take the first 50 to avoid too many requests
      for (let i = 0; i < Math.min(50, storyIds.length); i++) {
        const storyId = storyIds[i];
        const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
        if (!storyResponse.ok) {
          continue;
        }
        const story = await storyResponse.json();

        // Skip if it's not a story or if it's deleted or dead
        if (!story || story.dead || story.type !== 'story') {
          continue;
        }

        const title = story.title ?? '';
        const url = story.url ?? `https://news.ycombinator.com/item?id=${story.id}`;
        // For HN, the content is the text if it's a story with text, otherwise we can use the title.
        // But note: the story might be a link to an external site. We'll use the title as the content if there's no text.
        const content = story.text ? story.text.trim() : title;
        const score = story.score ?? 0;

        posts.push(this.buildRawPost(
          'hackernews',
          title,
          content,
          url,
          score
        ));
      }
    } catch (error) {
      console.error('HackerNewsAdapter collection error:', error);
    }

    return posts;
  }

  /**
   * Health check for Hacker News API.
   * Try to fetch the top stories.
   */
  async health(): Promise<boolean> {
    try {
      const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json?limit=1');
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Rate limit for Hacker News API.
   * The official API doesn't specify a strict rate limit, but we should be polite.
   * We'll use 60 requests per minute (which is 1 per second) as a safe limit.
   */
  rateLimit(): number {
    return 60; // requests per minute
  }
}