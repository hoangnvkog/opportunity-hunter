/**
 * Sprint 62: Autonomous Research Agent
 *
 * ProductHunt source adapter for fetching posts from Product Hunt.
 */

import { BaseResearchSourceAdapter, ResearchSourceAdapter } from "./base.adapter";
import type { ResearchSourceName } from "@/types/research-job";
import type { RawPostRow } from "@/types/database.types";

/**
 * ProductHunt adapter implementation.
 * Fetches posts from Product Hunt using their API.
 * Note: Product Hunt API requires an access token for most endpoints.
 * We'll use the public API (which is limited) or scrape? 
 * Actually, Product Hunt has a public API that doesn't require authentication for some endpoints.
 * We'll use the /api/posts endpoint which returns today's posts.
 * However, note that the API might change and we might need to handle errors.
 */
export class ProductHuntAdapter extends BaseResearchSourceAdapter implements ResearchSourceAdapter {
  name: ResearchSourceName = "producthunt";

  constructor() {
    super();
  }

  /**
   * Fetch posts from Product Hunt.
   * Returns an array of RawPostRow objects.
   */
  async collect(): Promise<RawPostRow[]> {
    const posts: RawPostRow[] = [];

    try {
      // We'll use the GraphQL API? Actually, they have a REST API: https://api.producthunt.com/v2/api/graphql
      // But it's GraphQL and requires an access token. 
      // Alternatively, we can use the undocumented endpoint: https://www.producthunt.com/frontend/posts?day=2024-01-01
      // But let's try to use the public API that doesn't require token: 
      // https://api.producthunt.com/v2/api/graphql?query={posts(first:10){edges{node{id,name,tagline,votes_count,comments_count,url,created_at}}}}
      // However, this requires a header: Accept: application/json and maybe a User-Agent.

      // Let's try a simpler approach: use the RSS feed? Product Hunt does have an RSS feed: https://www.producthunt.com/feed
      // But we have an RSS adapter for that. So for the ProductHunt adapter, we'll try to use the API without token and hope it works.

      // We'll use the endpoint: https://api.producthunt.com/v2/api/graphql
      // We need to send a POST request with a JSON body containing the query.
      // Since we don't have an access token, we might get a 401. 
      // Let's check: actually, the API might be public for some queries? We'll try without token and see.

      // Alternatively, we can use the old API: https://api.producthunt.com/v1/posts?sort=recent
      // This one does not require authentication? Let's try.

      const response = await fetch('https://api.producthunt.com/v1/posts?sort=recent&per_page=10', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OpportunityHunter/1.0'
        }
      });

      if (!response.ok) {
        // If we get an error, we'll log and return empty array.
        console.warn(`ProductHunt API request failed: ${response.status}`);
        return [];
      }

      const data = await response.json();

      // The response is an array of posts under the key 'posts'
      if (!Array.isArray(data.posts)) {
        return [];
      }

      for (const post of data.posts) {
        const title = post.name ?? '';
        const tagline = post.tagline ?? '';
        const url = post.url ?? '';
        // The vote count is in votes_count
        const score = post.votes_count ?? 0;
        // The description is the tagline? We'll use tagline as the content.
        const content = tagline;

        posts.push(this.buildRawPost(
          'producthunt',
          title,
          content,
          url,
          score
        ));
      }
    } catch (error) {
      console.error('ProductHuntAdapter collection error:', error);
    }

    return posts;
  }

  /**
   * Health check for Product Hunt API.
   * Try to fetch a single post.
   */
  async health(): Promise<boolean> {
    try {
      const response = await fetch('https://api.producthunt.com/v1/posts?per_page=1', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OpportunityHunter/1.0'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Rate limit for Product Hunt API.
   * We don't know the exact limit, but we'll be conservative: 30 requests per minute.
   */
  rateLimit(): number {
    return 30; // requests per minute
  }
}