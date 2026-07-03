/**
 * Supabase module barrel.
 *
 * IMPORTANT: Client Components must import from "./client-browser" only.
 * Server-only code is in "./client" and "./service-client".
 */
export {
  getSupabaseBrowserClient,
  type AppSupabaseClient,
} from "./client-browser";
export { getSupabaseServerClient } from "./client";
export { getSupabaseServiceClient } from "./service-client";
