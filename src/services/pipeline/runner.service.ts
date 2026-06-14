/**
 * Pipeline Runner - orchestrates the entire Opportunity Hunter pipeline
 * 
 * Flow:
 * Reddit → raw_posts → pain_points → pain_clusters → opportunities → startup_ideas
 */

import { ingestSubreddit } from "@/services/reddit";
import { extractPainPointsFromPosts } from "./pain-points.service";
import { clusterPainPointsFromDatabase } from "./clusters.service";
import { generateOpportunitiesFromDatabase } from "./opportunities.service";
import { generateStartupIdeasFromDatabase } from "./startup-ideas.service";

/**
 * Result of a complete pipeline run
 */
export interface PipelineRunResult {
  rawPosts: number;
  painPoints: number;
  clusters: number;
  opportunities: number;
  ideas: number;
}

/**
 * Run the complete Opportunity Hunter pipeline
 * 
 * Stages:
 * 1. Ingest posts from Reddit (default: r/Entrepreneur)
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
    // Stage 1: Ingest Reddit posts
    const rawPosts = await ingestSubreddit("Entrepreneur", 25);
    
    if (rawPosts.inserted === 0) {
      console.log("No new raw posts ingested (all duplicates)");
    }
    
    // Stage 2: Extract pain points
    const painPoints = await extractPainPointsFromPosts(50);
    
    if (painPoints.inserted === 0) {
      console.log("No new pain points extracted (all duplicates or no posts)");
    }
    
    // Stage 3: Cluster pain points
    const clusters = await clusterPainPointsFromDatabase(100);
    
    if (clusters.inserted === 0) {
      console.log("No new clusters created (all duplicates or no pain points)");
    }
    
    // Stage 4: Generate opportunities
    const opportunities = await generateOpportunitiesFromDatabase(50);
    
    if (opportunities.inserted === 0) {
      console.log("No new opportunities generated (all duplicates or no clusters)");
    }
    
    // Stage 5: Generate startup ideas
    const ideas = await generateStartupIdeasFromDatabase(50);
    
    if (ideas.inserted === 0) {
      console.log("No new startup ideas generated (all duplicates or no opportunities)");
    }
    
    return {
      rawPosts: rawPosts.inserted,
      painPoints: painPoints.inserted,
      clusters: clusters.inserted,
      opportunities: opportunities.inserted,
      ideas: ideas.inserted,
    };
  } catch (error) {
    // Determine which stage failed and provide meaningful error
    const message = error instanceof Error ? error.message : String(error);
    
    if (message.includes("reddit") || message.includes("Reddit")) {
      throw new Error(`Pipeline failed at stage 1 (Reddit ingestion): ${message}`);
    } else if (message.includes("pain_point") || message.includes("pain point")) {
      throw new Error(`Pipeline failed at stage 2 (pain point extraction): ${message}`);
    } else if (message.includes("cluster")) {
      throw new Error(`Pipeline failed at stage 3 (clustering): ${message}`);
    } else if (message.includes("opportunit")) {
      throw new Error(`Pipeline failed at stage 4 (opportunity generation): ${message}`);
    } else if (message.includes("idea") || message.includes("startup")) {
      throw new Error(`Pipeline failed at stage 5 (startup idea generation): ${message}`);
    } else {
      throw new Error(`Pipeline failed: ${message}`);
    }
  }
}
