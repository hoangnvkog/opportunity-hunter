import { SourceProvider } from "@/types/source-provider";
import { RawPostInput } from "@/types/pipeline";

/**
 * Twitter/X source provider
 * Searches for founder pain signals using Twitter API v2
 */
export const twitterProvider: SourceProvider = {
  name: "twitter",

  async fetchPosts(limit: number = 50): Promise<RawPostInput[]> {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
      console.warn("TWITTER_BEARER_TOKEN not set, skipping Twitter source");
      return [];
    }

    // Pain signal search queries
    const painSignals = [
      "looking for",
      "wish there was",
      "frustrated with",
      "hate using",
      "manual process",
      "time consuming",
      "spreadsheet",
      "too expensive",
      "can't find",
      "need a tool",
    ];

    // Combine queries with OR
    const query = painSignals.map((q) => `"${q}"`).join(" OR ");

    try {
      const url = new URL("https://api.twitter.com/2/tweets/search/recent");
      url.searchParams.set("query", query);
      url.searchParams.set("max_results", Math.min(limit, 100).toString());
      url.searchParams.set(
        "tweet.fields",
        "created_at,public_metrics,author_id"
      );

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Twitter API error: ${response.status} - ${error}`);
        return [];
      }

      interface TwitterTweet {
        id: string;
        text: string;
        created_at?: string;
        public_metrics?: {
          like_count?: number;
          retweet_count?: number;
          reply_count?: number;
          quote_count?: number;
        };
      }

      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        console.warn("Twitter API returned no data");
        return [];
      }

      const posts: RawPostInput[] = data.data.map((tweet: TwitterTweet) => {
        const metrics = tweet.public_metrics || {};
        const score =
          (metrics.like_count || 0) + (metrics.retweet_count || 0);

        return {
          source: "twitter",
          title: tweet.text.substring(0, 80),
          content: tweet.text,
          url: `https://twitter.com/i/status/${tweet.id}`,
          score,
          created_at: tweet.created_at || new Date().toISOString(),
        };
      });

      console.log(`Twitter: Fetched ${posts.length} posts`);
      return posts;
    } catch (error) {
      console.error("Twitter source error:", error);
      return [];
    }
  },
};
