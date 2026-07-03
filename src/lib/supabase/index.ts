/**
 * Supabase module barrel.
 *
 * IMPORTANT: Client Components must import from "./client" only.
 * Server-only code is in "./server" and "./service-client".
 */
export {
  getSupabaseBrowserClient,
  type AppSupabaseClient,
} from "./client";
export { getSupabaseServerClient, createClient } from "./server";
export { getSupabaseServiceClient } from "./service-client";
