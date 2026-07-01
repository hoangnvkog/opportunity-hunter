// Supabase server client re-export for Sprint 60
// Returns a stub client in tests, real client in production

import type { SupabaseClient } from '@supabase/supabase-js';

// Type-agnostic client (works for real SupabaseClient or stub)
type AnyClient = SupabaseClient | { [key: string]: unknown };

function makeBuilder(data: unknown, error: unknown | null) {
  const builder: AnyClient = {
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

const stubClient: AnyClient = {
  from: () => makeBuilder(null, new Error('stub client - test environment')),
  rpc: () => Promise.resolve({ data: null, error: null }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
};

export async function createClient(): Promise<AnyClient> {
  // In test environment, return stub to avoid server-only imports
  if (typeof process !== 'undefined' && process.env?.VITEST) {
    return stubClient;
  }
  // In production, use real server client (dynamic import avoids bundling)
  const mod = await import('./client');
  return mod.getSupabaseServerClient();
}
