/**
 * CLI / background-job environment loader.
 *
 * Same shape as `getServerEnv()` but WITHOUT `import "server-only"`,
 * so it can be loaded outside the Next.js runtime (CLI scripts, cron
 * jobs, pipeline runners, Vercel cron scheduled tasks).
 *
 * Only the SUPABASE_SERVICE_ROLE_KEY is required here, because the
 * service client bypasses RLS and needs full DB access.
 */

import { z } from "zod";

const ServiceEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required for CLI/server access"),
});

export type ServiceEnv = z.infer<typeof ServiceEnvSchema>;

let cached: ServiceEnv | null = null;

/**
 * Resolve and validate CLI-side environment variables.
 *
 * Cached after the first successful call.
 */
export function getServiceEnv(): ServiceEnv {
  if (cached) return cached;

  const parsed = ServiceEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `[env.service] ${issue?.path?.join(".") ?? "?"}: ${issue?.message ?? "invalid"}`,
    );
  }

  cached = parsed.data;
  return cached;
}
