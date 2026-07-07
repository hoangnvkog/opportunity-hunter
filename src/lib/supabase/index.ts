/**
 * Supabase module barrel.
 *
 * IMPORTANT - environment-aware split (the ONLY way to import
 * Supabase clients in this repo):
 *
 *   - Browser / Client Components ("use client")   → import from
 *     "./client"  (never through this barrel)
 *
 *   - App Router server code (server components, route handlers,
 *     server actions that need cookies()) → import directly from
 *     "./server"  (never through this barrel)
 *
 *   - CLI scripts, cron jobs, pipeline runners, background workers
 *     → import from THIS barrel or directly from "./service-client"
 *
 * The barrel ONLY re-exports the service-client (Next.js-runtime-free).
 *
 * This file deliberately does NOT re-export:
 *   - "./server" (pulls next/headers → "Client Component module" error
 *     in CLI)
 *   - "./client" (browser-only; not useful in Node CLI and just adds
 *     wasted work)
 *   - "server-only" (synchronous RuntimeError outside Next.js)
 *
 * If a consumer needs `getSupabaseServerClient()` or
 * `getSupabaseBrowserClient()` they MUST import the matching file
 * directly. Doing so keeps the dependency graph honest.
 */
export { getSupabaseServiceClient } from "./service-client";
