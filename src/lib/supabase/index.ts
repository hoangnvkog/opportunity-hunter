/**
 * Supabase module barrel — DELIBERATELY THIN.
 *
 * This file exists ONLY to give pipeline / CLI / background-job code a
 * single, safe entry point that cannot accidentally drag in Next.js
 * runtime modules. It re-exports exactly ONE client:
 *
 *   ./service   → `getSupabaseServiceClient()`  (service role key, no RLS)
 *
 * It DOES NOT re-export:
 *
 *   ./server    — pulls `next/headers`; importing it from a CLI tool
 *                  produces `This module cannot be imported from a
 *                  Client Component module`. App Router code must
 *                  import `./server` directly when it actually needs
 *                  the cookie-based client.
 *
 *   ./browser   — uses anon key + window check. Useless in a Node
 *                  CLI and would just add dead weight to the bundle.
 *
 *   `server-only` — synchronous RuntimeError outside Next.js.
 *
 * Read this as:
 *
 *   - Pipeline / CLI / background workers → import from THIS file or
 *                                          directly from `./service`.
 *   - App Router server code             → import directly from
 *                                          `./server`.
 *   - Client Components                   → import directly from
 *                                          `./browser`.
 *
 * Keeping the barrel thin is the single most important thing here:
 * a verbose barrel makes it trivial for a future contributor to
 * re-export `./server` by accident and undo Sprint 66.
 */
export { getSupabaseServiceClient } from "./service";
export type { AppSupabaseClient } from "./browser";
