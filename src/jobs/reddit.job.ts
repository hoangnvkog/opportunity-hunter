/**
 * Reddit ingestion cron job
 * Scheduled task for fetching posts from Reddit
 */

import { ingestSubreddit } from "@/services/reddit";

async function main() {
  try {
    console.log(`[${new Date().toISOString()}] Starting Reddit ingestion job...`);
    console.log("Subreddit: Entrepreneur");
    console.log("Limit: 25 posts\n");

    const result = await ingestSubreddit("Entrepreneur", 25);

    console.log("Reddit ingestion job completed:");
    console.table(result);

    if (result.inserted === 0) {
      console.log("\nℹ️  No new posts inserted (all were duplicates)");
    } else {
      console.log(`\n✅ Job completed: ${result.inserted} new posts inserted`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Reddit ingestion job failed:`);
    console.error(error);
    process.exit(1);
  }
}

main();
