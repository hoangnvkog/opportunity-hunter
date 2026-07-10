/**
 * Browser Supabase client.
 *
 * Safe to import from Client Components ("use client") and from any
 * browser-side code. Uses the anon key; subject to RLS. No server
 * imports, no `next/headers`, no cookies. If cookie-based auth is
 * needed, use `./server` from an App Router context instead.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types";
import { getPublicEnv } from "@/lib/env";

/**
 * Supabase client typed against our `Database` schema.
 *
 * Shared across ./browser, ./server, and ./service so all three
 * are assignment-compatible from a TypeScript POV.
 */
export type AppSupabaseClient = SupabaseClient<Database>;

let browserClient: AppSupabaseClient | null = null;

/**
 * Singleton browser Supabase client.
 *
 * Hard-fails on the server: pair this with `./server` rather than
 * guessing at runtime.
 */
export function getSupabaseBrowserClient(): AppSupabaseClient {
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseBrowserClient() called on the server. " +
        "Use getSupabaseServerClient() from @/lib/supabase/server instead.",
    );
  }

  if (browserClient) return browserClient;

  const env = getPublicEnv();
  browserClient = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ) as unknown as AppSupabaseClient;
  return browserClient;
}
