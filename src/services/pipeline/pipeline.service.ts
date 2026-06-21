import { PipelineRunsRepository } from "@/lib/db/repositories";
import { runPipeline as runOriginalPipeline } from "./runner.service";
import type { PipelineRunResult } from "@/types/pipeline-run";
import type { PipelineRunResult as OriginalPipelineRunResult } from "./runner.service";

/**
 * Execute the complete pipeline with history tracking
 */
export async function runPipeline(): Promise<PipelineRunResult> {
  const repository = await PipelineRunsRepository.create();
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  let status: "success" | "failed" = "success";
  let result: OriginalPipelineRunResult = {
    sources: 0,
    rawPosts: 0,
    painPoints: 0,
    embeddings: 0,
    clusters: 0,
    opportunities: 0,
    ideas: 0,
    averageClusterSize: 0,
    largestClusterSize: 0,
  };

  try {
    // Run the original pipeline
    result = await runOriginalPipeline();
    status = "success";
  } catch (error) {
    status = "failed";
    console.error("Pipeline execution failed:", error);
    throw error;
  } finally {
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    // Always save history, even for failed runs
    try {
      await repository.create({
        started_at: startedAt,
        finished_at: finishedAt,
        duration_ms: durationMs,
        sources: result.sources,
        raw_posts: result.rawPosts,
        pain_points: result.painPoints,
        embeddings: result.embeddings,
        clusters: result.clusters,
        opportunities: result.opportunities,
        startup_ideas: result.ideas,
        average_cluster_size: result.averageClusterSize,
        largest_cluster_size: result.largestClusterSize,
        status,
      });
    } catch (historyError) {
      console.error("Failed to save pipeline history:", historyError);
    }

    return {
      sources: result.sources,
      rawPosts: result.rawPosts,
      painPoints: result.painPoints,
      embeddings: result.embeddings,
      clusters: result.clusters,
      opportunities: result.opportunities,
      startupIdeas: result.ideas,
      averageClusterSize: result.averageClusterSize,
      largestClusterSize: result.largestClusterSize,
      durationMs,
    };
  }
}
