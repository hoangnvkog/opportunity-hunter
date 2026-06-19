import { fetchRawPosts } from "./reddit.service";
import { extractPainPointsFromPosts } from "./pain-points.service";
import { clusterPainPointsFromDatabase } from "./clusters.service";
import { generateOpportunitiesFromDatabase } from "./opportunities.service";
import { generateStartupIdeasFromDatabase } from "./startup-ideas.service";
import type { PipelineRunStats } from "@/types/pipeline-run";

let isRunning = false;

export async function runFullPipeline(): Promise<PipelineRunStats> {
  if (isRunning) {
    throw new Error("Pipeline already running");
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log("\n" + "=".repeat(50));
    console.log("OPPORTUNITY HUNTER - FULL PIPELINE RUN");
    console.log("=".repeat(50) + "\n");

    // Step 1: Fetch Reddit posts
    console.log("📡 Step 1: Fetching Reddit posts...");
    const rawPosts = await fetchRawPosts();
    console.log(`   ✓ Fetched ${rawPosts.length} posts\n`);

    // Step 2: Extract pain points
    console.log("🔍 Step 2: Extracting pain points...");
    const painPointsStats = await extractPainPointsFromPosts();
    console.log(
      `   ✓ Processed: ${painPointsStats.processed}, Extracted: ${painPointsStats.extracted}, Inserted: ${painPointsStats.inserted}\n`
    );

    // Step 3: Cluster pain points
    console.log("🎯 Step 3: Clustering pain points...");
    const clustersStats = await clusterPainPointsFromDatabase();
    console.log(
      `   ✓ Processed: ${clustersStats.processed}, Clustered: ${clustersStats.clustered}, Inserted: ${clustersStats.inserted}\n`
    );

    // Step 4: Generate opportunities
    console.log("💡 Step 4: Generating opportunities...");
    const opportunitiesStats = await generateOpportunitiesFromDatabase();
    console.log(
      `   ✓ Processed: ${opportunitiesStats.processed}, Generated: ${opportunitiesStats.generated}, Inserted: ${opportunitiesStats.inserted}\n`
    );

    // Step 5: Generate startup ideas
    console.log("🚀 Step 5: Generating startup ideas...");
    const ideasStats = await generateStartupIdeasFromDatabase();
    console.log(
      `   ✓ Processed: ${ideasStats.processed}, Generated: ${ideasStats.generated}, Skipped: ${ideasStats.skipped}, Inserted: ${ideasStats.inserted}\n`
    );

    const durationMs = Date.now() - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    console.log("=".repeat(50));
    console.log(`✅ PIPELINE COMPLETED in ${durationSec}s`);
    console.log("=".repeat(50) + "\n");

    return {
      postsFetched: rawPosts.length,
      painPoints: {
        processed: painPointsStats.processed,
        extracted: painPointsStats.extracted,
        skipped: 0, // reddit service doesn't track skipped
        inserted: painPointsStats.inserted,
      },
      clusters: {
        processed: clustersStats.processed,
        clustered: clustersStats.clustered,
        skipped: 0,
        inserted: clustersStats.inserted,
      },
      opportunities: {
        processed: opportunitiesStats.processed,
        generated: opportunitiesStats.generated,
        skipped: 0,
        inserted: opportunitiesStats.inserted,
      },
      ideas: {
        processed: ideasStats.processed,
        generated: ideasStats.generated,
        skipped: ideasStats.skipped,
        inserted: ideasStats.inserted,
      },
      durationMs,
    };
  } finally {
    isRunning = false;
  }
}
