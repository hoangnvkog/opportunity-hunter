/**
 * Reddit source provider
 *
 * Currently returns mock data. Ready for real API integration.
 */

import type { SourceProvider } from "@/types/source-provider";
import type { RawPostInput } from "@/types/pipeline";

export const redditProvider: SourceProvider = {
  name: "reddit",

  async fetchPosts(limit = 25): Promise<RawPostInput[]> {
    // Mock implementation - returns sample posts
    // In production, this would call Reddit API or other sources
    // Note: id is NOT included - database will generate UUID after insert
    console.log(`Fetching ${limit} Reddit posts...`);

    return [
      {
        source: "reddit",
        title:
          "Struggling with inventory management for my small e-commerce business",
        content:
          "I've been running my online store for 6 months and inventory management is killing me. I'm using spreadsheets but it's error-prone and I keep overselling items. Need something better.",
        url: "https://reddit.com/r/ecommerce/struggling-inventory-management",
        score: 85,
        created_at: new Date().toISOString(),
      },
      {
        source: "reddit",
        title: "Customer support is eating all my time",
        content:
          "As a solo founder, I spend 4+ hours daily answering the same customer questions. Looking for AI chatbot solutions that actually work for SaaS products.",
        url: "https://reddit.com/r/SaaS/customer-support-time-drain",
        score: 92,
        created_at: new Date().toISOString(),
      },
      {
        source: "reddit",
        title: "Need help tracking remote team productivity",
        content:
          "Managing a distributed team across 3 timezones is hard. Current tools don't give me visibility into what's actually getting done without micromanaging.",
        url: "https://reddit.com/r/remotejobs/tracking-remote-productivity",
        score: 78,
        created_at: new Date().toISOString(),
      },
    ];
  },
};
