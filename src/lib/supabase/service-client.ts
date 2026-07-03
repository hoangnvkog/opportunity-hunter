/**
 * Service-role Supabase client (server only, bypasses RLS).
 *
 * Separated from client.ts to avoid pulling 'server-only' imports
 * into client component bundles.
 */

import type { Database } from "@/types";
import { getPublicEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env.server";
import { createClient as createRawClient } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "./client";

let serviceClient: AppSupabaseClient | null = null;

/**
 * Server-only client with full database access. Use sparingly: prefer the
 * authenticated `getSupabaseServerClient()` whenever RLS is enough.
 */
export function getSupabaseServiceClient(): AppSupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseServiceClient() called in the browser. " +
        "This is a server-only helper.",
    );
  }

  if (serviceClient) return serviceClient;

  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();

  serviceClient = createRawClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return serviceClient;
}
