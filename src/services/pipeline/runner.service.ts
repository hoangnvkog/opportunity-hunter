/**
 * Pipeline Runner - orchestrates the entire Opportunity Hunter pipeline
 *
 * Flow:
 * Multi-source ingestion → raw_posts → pain_points → embeddings → pain_clusters → opportunities → startup_ideas
 */

import { fetchAllSources } from "@/services/sources/ingestion.service";
import { RawPostsRepository } from "@/lib/db/repositories";
import { extractPainPointsFromPosts } from "./pain-points.service";
import { generateEmbeddingsFromDatabase } from "./embeddings.service";
import { clusterPainPointsFromDatabase } from "./clusters.service";
import { generateOpportunitiesFromDatabase } from "./opportunities.service";
import { generateStartupIdeasFromDatabase } from "./startup-ideas.service";

/**
 * Result of a complete pipeline run
 */
export interface PipelineRunResult {
  sources: number;
  rawPosts: number;
  painPoints: number;
  embeddings: number;
  clusters: number;
  opportunities: number;
  ideas: number;
  averageClusterSize: number;
  largestClusterSize: number;
}

/**
 * Run the complete Opportunity Hunter pipeline
 *
 * Stages:
 * 1. Ingest posts from multiple sources (Reddit, Hacker News)
 * 2. Extract pain points from raw posts
 * 3. Cluster similar pain points
 * 4. Generate opportunities from clusters
 * 5. Generate startup ideas from opportunities
 *
 * @returns Pipeline execution results with counts for each stage
 *
 * @throws Error if any pipeline stage fails
 *
 * @example
 * ```typescript
 * const result = await runPipeline();
 * console.log(result);
 * // {
 * //   sources: 2,
 * //   rawPosts: 22,
 * //   painPoints: 45,
 * //   clusters: 8,
 * //   opportunities: 7,
 * //   ideas: 5
 * // }
 * ```
 */
export async function runPipeline(): Promise<PipelineRunResult> {
  try {
    // Stage 1: Ingest posts from all sources
    const rawPosts = await fetchAllSources(25);
    const sourcesCount = new Set(rawPosts.map((post) => post.source)).size;

    if (rawPosts.length === 0) {
      console.warn("No posts fetched from any source. Pipeline cannot continue.");
      throw new Error("No posts fetched from any source");
    }

    console.log(`Fetched ${rawPosts.length} posts from ${sourcesCount} sources`);

    // Insert posts into database
    const repository = await RawPostsRepository.create();

    // Check for existing URLs to prevent duplicates
    const existingPosts = await repository.list({ limit: 1000 });
    const existingUrls = new Set(existingPosts.map((post) => post.url));

    // Filter out duplicates
    const newPosts = rawPosts.filter((post) => !existingUrls.has(post.url));

    let insertedCount = 0;
    if (newPosts.length > 0) {
      const result = await repository.createMany(newPosts);
      insertedCount = result.length;
      console.log(`Inserted ${insertedCount} new posts`);
    } else {
      console.log("No new posts to insert (all duplicates)");
    }
    
    // Stage 2: Extract pain points
    const painPoints = await extractPainPointsFromPosts(50);

    if (painPoints.inserted === 0) {
      console.log("No new pain points extracted (all duplicates or no posts)");
    }

    // Stage 3: Generate embeddings for pain points (optional - requires OpenAI provider)
    let embeddingsResult = { processed: 0, skipped: 0, inserted: 0 };
    try {
      embeddingsResult = await generateEmbeddingsFromDatabase(1000);
      
      if (embeddingsResult.inserted === 0) {
        console.log("No new embeddings generated (all pain points already have embeddings or provider not supported)");
      } else {
        console.log(`Generated ${embeddingsResult.inserted} embeddings (${embeddingsResult.skipped} skipped)`);
      }
    } catch (error) {
      // Embeddings are optional - log error but don't fail pipeline
      console.warn("Embeddings generation failed (optional stage):", error);
    }

    // Stage 4: Cluster pain points
    const clusters = await clusterPainPointsFromDatabase(100);

    if (clusters.inserted === 0) {
      console.log("No new clusters created (all duplicates or no pain points)");
    }

    // Stage 5: Generate opportunities
    const opportunities = await generateOpportunitiesFromDatabase(50);

    if (opportunities.inserted === 0) {
      console.log("No new opportunities generated (all duplicates or no clusters)");
    }

    // Stage 6: Generate startup ideas
    const ideas = await generateStartupIdeasFromDatabase(50);

    if (ideas.inserted === 0) {
      console.log("No new startup ideas generated (all duplicates or no opportunities)");
    }

    return {
      sources: sourcesCount,
      rawPosts: insertedCount,
      painPoints: painPoints.inserted,
      embeddings: embeddingsResult.inserted,
      clusters: clusters.inserted,
      opportunities: opportunities.inserted,
      ideas: ideas.inserted,
      averageClusterSize: clusters.averageClusterSize,
      largestClusterSize: clusters.largestClusterSize,
    };
  } catch (error) {
    // Determine which stage failed and provide meaningful error
    const message = error instanceof Error ? error.message : String(error);
    
    if (message.includes("reddit") || message.includes("Reddit")) {
      throw new Error(`Pipeline failed at stage 1 (Reddit ingestion): ${message}`);
    } else if (message.includes("pain_point") || message.includes("pain point")) {
      throw new Error(`Pipeline failed at stage 2 (pain point extraction): ${message}`);
    } else if (message.includes("embedding")) {
      throw new Error(`Pipeline failed at stage 3 (embeddings generation): ${message}`);
    } else if (message.includes("cluster")) {
      throw new Error(`Pipeline failed at stage 4 (clustering): ${message}`);
    } else if (message.includes("opportunit")) {
      throw new Error(`Pipeline failed at stage 5 (opportunity generation): ${message}`);
    } else if (message.includes("idea") || message.includes("startup")) {
      throw new Error(`Pipeline failed at stage 6 (startup idea generation): ${message}`);
    } else {
      throw new Error(`Pipeline failed: ${message}`);
    }
  }
}
