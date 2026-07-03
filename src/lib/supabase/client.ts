/**
 * Supabase browser client.
 *
 * Safe to import from Client Components ("use client").
 * Does NOT import from "next/headers" or any server-only module.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types";
import { getPublicEnv } from "@/lib/env";

/**
 * Supabase client typed against our `Database` schema.
 */
export type AppSupabaseClient = SupabaseClient<Database>;

let browserClient: AppSupabaseClient | null = null;

/**
 * Singleton browser Supabase client. Safe to call from "use client" components.
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
