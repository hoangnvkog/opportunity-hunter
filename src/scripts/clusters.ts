/**
 * Clustering script
 * Groups similar pain points into clusters using AI
 */

import { clusterPainPointsFromDatabase } from "@/services/pipeline";

async function main() {
  try {
    console.log("Starting pain points clustering...");
    console.log("Processing up to 100 pain points\n");

    const result = await clusterPainPointsFromDatabase();

    console.log("Clustering completed:");
    console.table(result);

    if (result.inserted === 0) {
      console.log("\nℹ️  No new clusters created (all were duplicates or no pain points)");
    } else {
      console.log(`\n✅ Successfully created ${result.inserted} new clusters`);
    }
  } catch (error) {
    console.error("❌ Clustering failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
