/**
 * Sprint 62: Autonomous Research Agent
 *
 * ResearchSourceAdapter interface and base adapter class.
 *
 * Each data source (reddit, github, etc.) must implement this interface.
 */

import type { ResearchSourceName } from "@/types/research-job";
import type { RawPostRow } from "@/types/database.types";

/**
 * Interface that all research source adapters must implement.
 */
export interface ResearchSourceAdapter {
  /** Unique identifier for the source (must match ResearchSourceName) */
  name: ResearchSourceName;
  /**
   * Collect raw posts from the source.
   * Returns an array of RawPostRow objects ready for insertion into the raw_posts table.
   */
  collect(): Promise<RawPostRow[]>;
  /**
   * Check if the source is healthy (e.g., API is reachable, credentials valid).
   * Returns true if healthy, false otherwise.
   */
  health(): Promise<boolean>;
  /**
   * Returns the rate limit for this source in requests per minute.
   * Used by the job engine to enforce rate limiting.
   */
  rateLimit(): number;
}

/**
 * Base class for research source adapters.
 * Provides common functionality and enforces the interface.
 */
export abstract class BaseResearchSourceAdapter implements ResearchSourceAdapter {
  abstract name: ResearchSourceName;
  abstract collect(): Promise<RawPostRow[]>;
  abstract rateLimit(): number;

  /**
   * Default implementation of health check.
   * Override in subclasses if specific health check logic is needed.
   */
  async health(): Promise<boolean> {
    // By default, assume healthy if we can instantiate the adapter.
    // Subclasses can override to perform actual health checks (e.g., API ping).
    return true;
  }

  /**
   * Helper function to convert a raw item to a RawPostRow.
   * This standardizes the format for the database.
   */
  protected buildRawPost(
    source: string,
    title: string,
    content: string,
    url: string,
    score: number = 0
  ): RawPostRow {
    return {
      id: crypto.randomUUID(),
      source,
      title,
      content,
      url,
      score,
      processed: false,
      created_at: new Date().toISOString(),
    };
  }
}