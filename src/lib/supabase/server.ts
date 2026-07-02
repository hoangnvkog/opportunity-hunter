// Supabase server client re-export for Sprint 60
// Returns a stub client in tests, real client in production

import type { AppSupabaseClient } from '@/lib/supabase/client';

// Type the client against our Database schema
type TypedSupabaseClient = AppSupabaseClient;

/* eslint-disable @typescript-eslint/no-explicit-any */
function makeBuilder(data: unknown, error: unknown | null) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    gte: () => builder,
    lte: () => builder,
    in: () => builder,
    or: () => builder,
    ilike: () => builder,
    not: () => builder,
    single: () => Promise.resolve({ data, error }),
    maybeSingle: () => Promise.resolve({ data, error }),
    insert: () => Promise.resolve({ data, error }),
    update: () => Promise.resolve({ data, error }),
    delete: () => Promise.resolve({ data, error }),
  };
  return builder;
}

const stubClient: any = {
  from: () => makeBuilder(null, new Error('stub client - test environment')),
  rpc: () => Promise.resolve({ data: null, error: null }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function createClient(): Promise<TypedSupabaseClient> {
  // In test environment, return stub to avoid server-only imports
  if (typeof process !== 'undefined' && process.env?.VITEST) {
    return stubClient as TypedSupabaseClient;
  }
  // In production, use real server client (dynamic import avoids bundling)
  const mod = await import('./client');
  return mod.getSupabaseServerClient();
}
