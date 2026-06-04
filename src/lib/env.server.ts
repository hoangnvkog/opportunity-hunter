/**
 * Server-only environment loader.
 *
 * The service role key grants full read/write access to the database and
 * MUST never be exposed to the browser. Importing this file from a client
 * component is a bug; we hard-fail at module load if it leaks.
 *
 * Use case: repository methods that need to bypass RLS for background
 * jobs, server actions, or the seed script.
 */

import "server-only";
import { z } from "zod";

const ServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required for server-side access"),
  SUPABASE_DB_URL: z
    .string()
    .url("SUPABASE_DB_URL must be a valid PostgreSQL connection string")
    .optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = ServerEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid server environment variables:\n${issues}\n\n` +
        `See \`.env.example\` for the expected shape.`,
    );
  }

  cached = parsed.data;
  return cached;
}
