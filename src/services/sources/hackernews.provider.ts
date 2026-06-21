/**
 * Hacker News source provider
 *
 * Fetches top stories from Hacker News Firebase API
 */

import type { SourceProvider } from "@/types/source-provider";
import type { RawPostInput } from "@/types/pipeline";

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  time: number;
  text?: string;
}

export const hackerNewsProvider: SourceProvider = {
  name: "hackernews",

  async fetchPosts(limit = 25): Promise<RawPostInput[]> {
    console.log(`Fetching ${limit} Hacker News posts...`);

    try {
      // Fetch top story IDs
      const topStoriesResponse = await fetch(
        "https://hacker-news.firebaseio.com/v0/topstories.json"
      );
      const topStoryIds: number[] = await topStoriesResponse.json();

      // Take only the first 'limit' stories
      const storyIdsToFetch = topStoryIds.slice(0, limit);

      // Fetch all stories in parallel
      const storyPromises = storyIdsToFetch.map(async (id) => {
        const response = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        );
        return response.json() as Promise<HNStory>;
      });

      const stories = await Promise.all(storyPromises);

      // Convert to RawPostInput format
      return stories.map((story) => ({
        source: "hackernews",
        title: story.title,
        content: story.text || "", // HackerNews posts may not have text content
        url:
          story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        score: story.score,
        created_at: new Date(story.time * 1000).toISOString(),
      }));
    } catch (error) {
      console.error("Failed to fetch Hacker News posts:", error);
      return [];
    }
  },
};
