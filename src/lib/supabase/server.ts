/**
 * Supabase server client (App Router with cookie auth).
 *
 * This module imports from "next/headers" and must NOT be imported
 * by Client Components. Use ./client.ts for browser code.
 */

import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types";
import { getPublicEnv } from "@/lib/env";

/**
 * Supabase client typed against our `Database` schema.
 */
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
            // setAll from a Server Component is a no-op. This is fine —
            // middleware refreshes the session.
          }
        },
      },
    },
  ) as unknown as AppSupabaseClient;
}

// Legacy alias — some files use createClient() instead of getSupabaseServerClient()
export const createClient = getSupabaseServerClient;
