/**
 * Sprint 62: Autonomous Research Agent
 *
 * GitHub source adapter for fetching issues from repositories.
 */

import { BaseResearchSourceAdapter, ResearchSourceAdapter } from "./base.adapter";
import type { ResearchSourceName } from "@/types/research-job";
import type { RawPostRow } from "@/types/database.types";

/**
 * GitHub adapter implementation.
 * Fetches issues from public repositories related to startups, SaaS, etc.
 */
export class GithubAdapter extends BaseResearchSourceAdapter implements ResearchSourceAdapter {
  name: ResearchSourceName = "github";

  // Repositories to monitor (we'll use the GitHub API to search for issues)
  // We'll search for issues with certain labels or in certain repos.
  // For simplicity, we'll use the search API for issues in popular tech repos.
  private searchQueries = [
    "repo:mozilla/servo label:help-wanted",
    "repo:facebook/react issue:open",
    "repo:nodejs/node issue:open",
    "repo:python/cpython issue:open",
    "repo:tensorflow/tensorflow issue:open",
    "repo:golang/go issue:open",
    "repo:rust-lang/rust issue:open",
    "repo:vuejs/vue issue:open",
    "repo:angular/angular issue:open",
    "repo:laravel/laravel issue:open",
  ];

  constructor() {
    super();
  }

  /**
   * Fetch issues from GitHub.
   * Returns an array of RawPostRow objects.
   */
  async collect(): Promise<RawPostRow[]> {
    const posts: RawPostRow[] = [];

    try {
      // For each search query, get the first page of results
      for (const query of this.searchQueries) {
        const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=5`;
        const response = await fetch(url, {
          headers: {
            // Optional: add a token if available for higher rate limit
            // Authorization: `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'OpportunityHunter/1.0'
          }
        });

        if (!response.ok) {
          // If we hit rate limit, we might get 403. We'll just skip and try next.
          console.warn(`GitHub search failed for query "${query}": ${response.status}`);
          continue;
        }

        const data = await response.json();

        for (const issue of data.items) {
          const title = issue.title.trim();
          const body = issue.body ?? '';
          const url = issue.html_url;
          // GitHub doesn't provide a score, but we can use reactions or comments as a proxy.
          // We'll use the number of reactions as a rough score.
          const score = (issue.reactions?.total_count ?? 0) + (issue.comments ?? 0);

          posts.push(this.buildRawPost(
            `github:${issue.repository_url.split('/').slice(-2).join('/')}`,
            title,
            body,
            url,
            score
          ));
        }
      }
    } catch (error) {
      console.error('GitHubAdapter collection error:', error);
    }

    return posts;
  }

  /**
   * Health check for GitHub API.
   * Try to fetch the Zen of GitHub.
   */
  async health(): Promise<boolean> {
    try {
      const response = await fetch('https://api.github.com/zen', {
        headers: {
          'User-Agent': 'OpportunityHunter/1.0'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Rate limit for GitHub API.
   * Without auth: 60 requests per hour. With auth: 5000 per hour.
   * We'll use a conservative estimate: 10 per minute (600 per hour) to be safe.
   */
  rateLimit(): number {
    return 10; // requests per minute
  }
}