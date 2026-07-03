/**
 * Sprint 62: Autonomous Research Agent
 *
 * RSS source adapter for fetching posts from RSS feeds.
 * Uses regex-based XML parsing to avoid external dependencies.
 */

import { BaseResearchSourceAdapter } from "./base.adapter";
import type { ResearchSourceName } from "@/types/research-job";
import type { RawPostRow } from "@/types/database.types";

/**
 * RSS adapter implementation.
 * Fetches and parses RSS feeds from configured URLs.
 */
export class RssAdapter extends BaseResearchSourceAdapter {
  name: ResearchSourceName = "rss";

  private feedUrls: string[] = [];

  constructor() {
    super();
    const urls = process.env.RSS_FEED_URLS ?? "";
    this.feedUrls = urls.split(",").map((u) => u.trim()).filter((u) => u.length > 0);
  }

  /**
   * Fetch and parse RSS feeds using regex (no xml2js dependency).
   */
  async collect(): Promise<RawPostRow[]> {
    const posts: RawPostRow[] = [];

    if (this.feedUrls.length === 0) {
      console.warn("RssAdapter: No feed URLs configured. Set RSS_FEED_URLS environment variable.");
      return posts;
    }

    for (const feedUrl of this.feedUrls) {
      try {
        const response = await fetch(feedUrl);
        if (!response.ok) {
          console.warn(`RssAdapter: Failed to fetch feed ${feedUrl}: ${response.status}`);
          continue;
        }
        const xmlText = await response.text();

        // Extract items using regex — matches <item>...</item> blocks
        const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
        let match: RegExpExecArray | null;

        while ((match = itemRegex.exec(xmlText)) !== null) {
          const itemXml = match[1];
          const title = this.extractTag(itemXml, "title");
          const link = this.extractTag(itemXml, "link");
          const description = this.extractTag(itemXml, "description");

          if (title && link) {
            const hostname = new URL(feedUrl).hostname;
            posts.push(this.buildRawPost(
              `rss:${hostname}`,
              title,
              description || title,
              link,
              0
            ));
          }
        }
      } catch (feedError) {
        console.error(`RssAdapter: Error processing feed ${feedUrl}:`, feedError);
      }
    }

    return posts;
  }

  /**
   * Extract the text content of an XML tag.
   */
  private extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i");
    const match = regex.exec(xml);
    return match?.[1]?.trim() ?? "";
  }

  async health(): Promise<boolean> {
    if (this.feedUrls.length === 0) return false;
    try {
      const response = await fetch(this.feedUrls[0]);
      return response.ok;
    } catch {
      return false;
    }
  }

  rateLimit(): number {
    return 10;
  }
}
