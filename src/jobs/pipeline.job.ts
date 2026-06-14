/**
 * Complete pipeline cron job
 * Scheduled task for running the entire Opportunity Hunter pipeline
 */

import { runPipeline } from "@/services/pipeline";

async function main() {
  try {
    console.log(`[${new Date().toISOString()}] Starting complete pipeline job...`);
    console.log("Executing all 5 stages:\n");
    console.log("  1. Reddit ingestion");
    console.log("  2. Pain points extraction");
    console.log("  3. Clustering");
    console.log("  4. Opportunities generation");
    console.log("  5. Startup ideas generation\n");

    const result = await runPipeline();

    console.log("Pipeline job completed:");
    console.table(result);

    const total = result.rawPosts + result.painPoints + result.clusters + 
                  result.opportunities + result.ideas;

    if (total === 0) {
      console.log("\nℹ️  No new data inserted (all were duplicates)");
    } else {
      console.log(`\n✅ Job completed: ${total} total new records created`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Pipeline job failed:`);
    console.error(error);
    process.exit(1);
  }
}

main();
