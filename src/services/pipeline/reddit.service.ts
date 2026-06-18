/**
 * Reddit service - fetches raw posts from Reddit and other sources.
 * Currently returns mock data. Ready for real API integration.
 */

import type { RawPostInput } from "@/types/pipeline";

/**
 * Fetch raw posts from configured sources (Reddit, Twitter, etc.)
 * TODO: Integrate with Reddit API, Twitter API, or web scrapers
 */
export async function fetchRawPosts(): Promise<RawPostInput[]> {
  // Mock implementation - returns sample posts
  // In production, this would call Reddit API or other sources
  // Note: id is NOT included - database will generate UUID after insert
  return [
    {
      source: "reddit",
      title: "Struggling with inventory management for my small e-commerce business",
      content:
        "I've been running my online store for 6 months and inventory management is killing me. I'm using spreadsheets but it's error-prone and I keep overselling items. Need something better.",
      url: "https://reddit.com/r/ecommerce/post-1",
      score: 85,
      created_at: new Date().toISOString(),
    },
    {
      source: "reddit",
      title: "Customer support is eating all my time",
      content:
        "As a solo founder, I spend 4+ hours daily answering the same customer questions. Looking for AI chatbot solutions that actually work for SaaS products.",
      url: "https://reddit.com/r/SaaS/post-2",
      score: 92,
      created_at: new Date().toISOString(),
    },
    {
      source: "reddit",
      title: "Need help tracking remote team productivity",
      content:
        "Managing a distributed team across 3 timezones is hard. Current tools don't give me visibility into what's actually getting done without micromanaging.",
      url: "https://reddit.com/r/remotejobs/post-3",
      score: 78,
      created_at: new Date().toISOString(),
    },
  ];
}
