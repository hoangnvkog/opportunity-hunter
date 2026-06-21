/**
 * Pipeline Job - Executable job for the scheduler
 * 
 * Wraps the full pipeline with logging, error handling, and history tracking.
 */

import { runPipeline } from "@/services/pipeline/pipeline.service";
import type { PipelineRunResult } from "@/types/pipeline-run";

let isRunning = false;

/**
 * Execute the pipeline job with overlap prevention
 * 
 * @returns Pipeline run result or null if already running
 */
export async function runPipelineJob(): Promise<PipelineRunResult | null> {
  if (isRunning) {
    console.log("⚠️  Pipeline already running. Skipping scheduled execution.");
    return null;
  }

  isRunning = true;
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  console.log("\n" + "=".repeat(60));
  console.log("🚀 PIPELINE EXECUTION STARTED");
  console.log("⏰ Started at:", startedAt);
  console.log("=".repeat(60) + "\n");

  try {
    const result = await runPipeline();
    
    const durationMs = Date.now() - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log("✅ PIPELINE EXECUTION COMPLETED");
    console.log("⏱️  Duration:", durationSec, "seconds");
    console.log("📊 Statistics:");
    console.log("   - Sources:", result.sources);
    console.log("   - Raw Posts:", result.rawPosts);
    console.log("   - Pain Points:", result.painPoints);
    console.log("   - Embeddings:", result.embeddings);
    console.log("   - Clusters:", result.clusters);
    console.log("   - Opportunities:", result.opportunities);
    console.log("   - Startup Ideas:", result.startupIdeas);
    console.log("   - Avg Cluster Size:", result.averageClusterSize.toFixed(2));
    console.log("   - Largest Cluster:", result.largestClusterSize);
    console.log("=".repeat(60) + "\n");

    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    console.error("\n" + "=".repeat(60));
    console.error("❌ PIPELINE EXECUTION FAILED");
    console.error("⏱️  Duration:", durationSec, "seconds");
    console.error("💥 Error:", error instanceof Error ? error.message : String(error));
    console.error("=".repeat(60) + "\n");

    throw error;
  } finally {
    isRunning = false;
  }
}

/**
 * Check if pipeline is currently running
 */
export function isPipelineRunning(): boolean {
  return isRunning;
}
