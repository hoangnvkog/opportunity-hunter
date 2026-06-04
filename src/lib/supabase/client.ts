/**
 * Supabase clients (browser + server).
 *
 * Two clients, one shared schema, clear naming:
 *   - `getSupabaseBrowserClient()` for client components / "use client" code.
 *     Uses the anon key, subject to RLS.
 *   - `getSupabaseServerClient()` for server components, route handlers,
 *     server actions, and the repository layer.
 *   - `getSupabaseServiceClient()` for background jobs / seed scripts that
 *     need to bypass RLS. Server-only.
 *
 * The clients are cached per-process. Do not call `createClient` from
 * the library yourself — go through these helpers.
 */

import type { CookieOptions } from "@supabase/ssr";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types";
import { getPublicEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env.server";

/**
 * Supabase client typed against our `Database` schema. All call sites in
 * the app use this so we have one place to change the generic if we
 * ever need to pin the schema explicitly.
 */
export type AppSupabaseClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Browser client
// ---------------------------------------------------------------------------

let browserClient: AppSupabaseClient | null = null;

/**
 * Singleton browser Supabase client. Safe to call from "use client"
 * components.
 */
export function getSupabaseBrowserClient(): AppSupabaseClient {
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseBrowserClient() called on the server. " +
        "Use getSupabaseServerClient() instead.",
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

// ---------------------------------------------------------------------------
// Server client (Next.js App Router, with cookie auth)
// ---------------------------------------------------------------------------

/**
 * Server client that reads/writes auth cookies. Use inside server
 * components, route handlers, and server actions.
 */
export async function getSupabaseServerClient(): Promise<AppSupabaseClient> {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll from a Server Component is a no-op. This is fine —
            // middleware refreshes the session.
          }
        },
      },
    },
  ) as unknown as AppSupabaseClient;
}

// ---------------------------------------------------------------------------
// Service-role client (server only, bypasses RLS)
// ---------------------------------------------------------------------------

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
