/**
 * Pain points extraction script
 * Extracts pain points from raw posts using AI
 */

import { extractPainPointsFromPosts } from "@/services/pipeline";

async function main() {
  try {
    console.log("Starting pain points extraction...");
    console.log("Processing up to 50 raw posts\n");

    const result = await extractPainPointsFromPosts();

    console.log("Pain points extraction completed:");
    console.table(result);

    if (result.inserted === 0) {
      console.log("\nℹ️  No new pain points inserted (all were duplicates or no posts)");
    } else {
      console.log(`\n✅ Successfully inserted ${result.inserted} new pain points`);
    }
  } catch (error) {
    console.error("❌ Pain points extraction failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
