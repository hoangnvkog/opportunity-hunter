/**
 * Source registry
 *
 * Central registry for all source providers
 */

import type { SourceProvider } from "@/types/source-provider";
import { redditProvider } from "./reddit.provider";
import { hackerNewsProvider } from "./hackernews.provider";
import { productHuntProvider } from "./producthunt.provider";
import { twitterProvider } from "./twitter.provider";

/**
 * Get all available source providers
 */
export function getSourceProviders(): SourceProvider[] {
  return [redditProvider, hackerNewsProvider, productHuntProvider, twitterProvider];
}
