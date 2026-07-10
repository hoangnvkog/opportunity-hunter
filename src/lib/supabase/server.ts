/**
 * Supabase server client (App Router with cookie auth).
 *
 * IMPORTS `next/headers` — must NEVER be imported by:
 *   - CLI scripts
 *   - Cron jobs
 *   - Background workers
 *   - Pipeline repositories
 *   - Anything running under tsx / a standalone Node process
 *
 * If the pipeline accidentally pulls this file in, you will get
 * `This module cannot be imported from a Client Component module`
 * at runtime. Keep it on the App Router side of the boundary.
 *
 * Browser code should use `./browser` instead.
 */

import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types";
import { getPublicEnv } from "@/lib/env";

export type AppSupabaseClient = SupabaseClient<Database>;

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
            // setAll from a Server Component is a no-op. Middleware
            // refreshes the session — this branch is expected.
          }
        },
      },
    },
  ) as unknown as AppSupabaseClient;
}

/**
 * Legacy alias kept for backward compatibility.
 *
 * Prefer `getSupabaseServerClient()` in new code.
 */
export const createClient = getSupabaseServerClient;
