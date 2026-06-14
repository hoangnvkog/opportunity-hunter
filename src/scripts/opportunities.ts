/**
 * Opportunities generation script
 * Generates business opportunities from pain clusters using AI
 */

import { generateOpportunitiesFromDatabase } from "@/services/pipeline";

async function main() {
  try {
    console.log("Starting opportunities generation...");
    console.log("Processing up to 50 clusters\n");

    const result = await generateOpportunitiesFromDatabase();

    console.log("Opportunities generation completed:");
    console.table(result);

    if (result.inserted === 0) {
      console.log("\nℹ️  No new opportunities created (all were duplicates or no clusters)");
    } else {
      console.log(`\n✅ Successfully created ${result.inserted} new opportunities`);
    }
  } catch (error) {
    console.error("❌ Opportunities generation failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
