/**
 * Service-role Supabase client.
 *
 * Pure Node implementation: no `next/*`, no `cookies()`, no
 * `next/headers`, no `server-only` package. Safe to import from:
 *
 *   - CLI scripts (`npm run pipeline`, seeds, one-off jobs)
 *   - Background workers and cron jobs
 *   - Repositories used by the pipeline
 *   - AI / analysis services that run outside the Next.js runtime
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY and bypasses RLS, so callers
 * MUST treat query results as untrusted input.
 */

import type { Database } from "@/types";
import { getPublicEnv } from "@/lib/env";
import { getServiceEnv } from "@/lib/env.service";
import { createClient as createRawClient } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "./browser";

let serviceClient: AppSupabaseClient | null = null;

/**
 * Process-wide singleton service-role client. Returns the same
 * connection on subsequent calls.
 *
 * Hard-fails in the browser: this grants full DB access and must
 * never leak into a Client Component bundle.
 */
export function getSupabaseServiceClient(): AppSupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseServiceClient() called in the browser. " +
        "This is server-only; use getSupabaseBrowserClient() instead.",
    );
  }

  if (serviceClient) return serviceClient;

  const publicEnv = getPublicEnv();
  const serviceEnv = getServiceEnv();

  serviceClient = createRawClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serviceEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return serviceClient;
}
