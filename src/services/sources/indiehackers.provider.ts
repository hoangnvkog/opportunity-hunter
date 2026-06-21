import { SourceProvider } from "@/types/source-provider";
import { RawPostInput } from "@/types/pipeline";

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  "dc:date"?: string;
}

/**
 * IndieHackers source provider
 * Fetches posts from IndieHackers community (via unofficial RSS feed)
 */
export const indieHackersProvider: SourceProvider = {
  name: "indiehackers",

  async fetchPosts(limit: number = 50): Promise<RawPostInput[]> {
    const apiKey = process.env.INDIEHACKERS_API_KEY;

    if (!apiKey) {
      console.warn("INDIEHACKERS_API_KEY not set, skipping IndieHackers source");
      return [];
    }

    try {
      // Use unofficial RSS feed since IndieHackers doesn't have official API
      const feedUrl = "https://feed.indiehackers.world/posts.rss";

      const response = await fetch(feedUrl, {
        headers: {
          "User-Agent": "OpportunityHunter/1.0",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
      });

      if (!response.ok) {
        console.error(`IndieHackers RSS feed error: ${response.status}`);
        return [];
      }

      const xml = await response.text();

      // Simple RSS parsing (no external dependencies)
      const items = parseRSS(xml, limit);

      const posts: RawPostInput[] = items.map((item) => {
        const title = item.title || "Untitled";
        const description = item.description || "";
        const link = item.link || "";
        const pubDate = item.pubDate || item["dc:date"] || new Date().toISOString();

        // RSS feeds don't typically have engagement metrics
        // Use a default score of 1 (minimal engagement signal)
        const score = 1;

        return {
          source: "indiehackers",
          title: title.substring(0, 80),
          content: description,
          url: link,
          score,
          created_at: new Date(pubDate).toISOString(),
        };
      });

      console.log(`IndieHackers: Fetched ${posts.length} posts`);
      return posts;
    } catch (error) {
      console.error("IndieHackers source error:", error);
      return [];
    }
  },
};

/**
 * Simple RSS parser (no external dependencies)
 */
function parseRSS(xml: string, limit: number): RSSItem[] {
  const items: RSSItem[] = [];

  // Extract all <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const itemXml = match[1];

    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const description = extractTag(itemXml, "description");
    const pubDate = extractTag(itemXml, "pubDate");
    const dcDate = extractTag(itemXml, "dc:date");

    if (title) {
      items.push({
        title: decodeHTMLEntities(title),
        link,
        description: description ? decodeHTMLEntities(description) : undefined,
        pubDate,
        "dc:date": dcDate,
      });
    }
  }

  return items;
}

/**
 * Extract content from XML tag
 */
function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * Decode common HTML entities
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
