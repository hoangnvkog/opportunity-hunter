/**
 * Base repository type alias.
 *
 * Concrete repositories declare their client field as
 * `private readonly client: AnySupabaseClient` so tests can inject a
 * stub without going through the real network.
 *
 * The translateError helper lives in `@/lib/db/errors` and is re-exported
 * from this module for convenience.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types";

export type AnySupabaseClient = SupabaseClient<Database>;

export { translateError } from "@/lib/db/errors";
