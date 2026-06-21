/**
 * Common interface for all source providers
 */

import type { RawPostInput } from "@/types/pipeline";

export interface SourceProvider {
  /** Unique identifier for this source */
  name: string;

  /** Fetch posts from this source */
  fetchPosts(limit?: number): Promise<RawPostInput[]>;
}
