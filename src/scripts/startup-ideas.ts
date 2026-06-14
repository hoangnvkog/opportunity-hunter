/**
 * Startup ideas generation script
 * Generates startup ideas from opportunities using AI
 */

import { generateStartupIdeasFromDatabase } from "@/services/pipeline";

async function main() {
  try {
    console.log("Starting startup ideas generation...");
    console.log("Processing up to 50 opportunities\n");

    const result = await generateStartupIdeasFromDatabase();

    console.log("Startup ideas generation completed:");
    console.table(result);

    if (result.inserted === 0) {
      console.log("\nℹ️  No new startup ideas created (all were duplicates or no opportunities)");
    } else {
      console.log(`\n✅ Successfully created ${result.inserted} new startup ideas`);
    }
  } catch (error) {
    console.error("❌ Startup ideas generation failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
