/**
 * AI Pipeline services - orchestrate data flow from raw posts to startup ideas
 */

export { fetchRawPosts } from "./reddit.service";
export { extractPainPoints, extractPainPointsFromPosts } from "./pain-points.service";
export { clusterPainPoints, clusterPainPointsFromDatabase } from "./clusters.service";
export { generateOpportunities, generateOpportunitiesFromDatabase } from "./opportunities.service";
export { generateStartupIdeas, generateStartupIdeasFromDatabase } from "./startup-ideas.service";
export { runPipeline, type PipelineRunResult } from "./runner.service";
