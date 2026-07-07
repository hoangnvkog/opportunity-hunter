/**
 * Supabase module barrel.
 *
 * IMPORTANT - environment-aware split:
 *
 * - Browser / Client Components → import from "./client" only.
 * - App Router server code (server components, route handlers, server
 *   actions that need cookies()) → import directly from "./server".
 * - CLI / background workers / cron jobs / pipelines → import from
 *   THIS barrel or directly from "./service-client".
 *
 * This barrel deliberately does NOT re-export "./server", which depends
 * on `next/headers`. Re-exporting it from a barrel that CLI scripts
 * pull would force every CLI run to evaluate `next/headers`, which
 * fails outside the Next.js runtime ("Client Component module").
 *
 * CLI / pipeline code MUST use getSupabaseServiceClient().
 * App Router code MUST use getSupabaseServerClient() from ./server.
 */
export {
  getSupabaseBrowserClient,
  type AppSupabaseClient,
} from "./client";
export { getSupabaseServiceClient } from "./service-client";
