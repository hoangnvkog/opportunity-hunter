/**
 * Reddit ingestion script
 * Fetches posts from r/Entrepreneur and stores them in the database
 */

import { ingestSubreddit } from "@/services/reddit";

async function main() {
  try {
    console.log("Starting Reddit ingestion...");
    console.log("Subreddit: Entrepreneur");
    console.log("Limit: 25 posts\n");

    const result = await ingestSubreddit("Entrepreneur", 25);

    console.log("Reddit ingestion completed:");
    console.table(result);

    if (result.inserted === 0) {
      console.log("\nℹ️  No new posts inserted (all were duplicates)");
    } else {
      console.log(`\n✅ Successfully inserted ${result.inserted} new posts`);
    }
  } catch (error) {
    console.error("❌ Reddit ingestion failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
