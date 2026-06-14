/**
 * Complete pipeline execution script
 * Runs all pipeline stages sequentially
 */

import { runPipeline } from "@/services/pipeline";

async function main() {
  try {
    console.log("🚀 Starting complete Opportunity Hunter pipeline...\n");
    console.log("Stages:");
    console.log("  1. Reddit ingestion (r/Entrepreneur, 25 posts)");
    console.log("  2. Pain points extraction (50 posts)");
    console.log("  3. Clustering (100 pain points)");
    console.log("  4. Opportunities generation (50 clusters)");
    console.log("  5. Startup ideas generation (50 opportunities)\n");

    const result = await runPipeline();

    console.log("✅ Pipeline completed successfully!\n");
    console.log("Results:");
    console.table(result);

    const total = result.rawPosts + result.painPoints + result.clusters + 
                  result.opportunities + result.ideas;

    if (total === 0) {
      console.log("\nℹ️  No new data inserted (all were duplicates)");
    } else {
      console.log(`\n🎉 Total new records created: ${total}`);
    }
  } catch (error) {
    console.error("❌ Pipeline execution failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
