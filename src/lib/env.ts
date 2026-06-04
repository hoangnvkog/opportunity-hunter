/**
 * Centralised, type-safe environment variable loader.
 *
 * Validates required variables at import time and surfaces a clear error
 * message when something is missing — better than discovering a typo via
 * a runtime Supabase auth failure 20 minutes later.
 *
 * Server-only secrets (e.g. SERVICE_ROLE_KEY) MUST be loaded only on the
 * server. The `@/lib/env.server` re-export is the right entry point for
 * those; this file is safe to import on both client and server.
 */

import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

export type PublicEnv = z.infer<typeof PublicEnvSchema>;

let cached: PublicEnv | null = null;

/**
 * Resolve and validate the public environment variables.
 *
 * Cached after the first successful call so we only pay the validation
 * cost once per process.
 */
export function getPublicEnv(): PublicEnv {
  if (cached) return cached;

  const parsed = PublicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid public environment variables:\n${issues}\n\n` +
        `See \`.env.example\` for the expected shape.`,
    );
  }

  cached = parsed.data;
  return cached;
}
