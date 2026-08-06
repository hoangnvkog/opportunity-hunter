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

/**
 * Runtime guard — same protection as `import "server-only"` but works
 * outside Next.js (CLI scripts, cron jobs, tsx).
 */
if (typeof window !== "undefined") {
  throw new Error(
    "env.server.ts can only be used on the server. " +
      "Importing this from a client component is a bug.",
  );
}
import { z } from "zod";

const ServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required for server-side access"),
  SUPABASE_DB_URL: z
    .string()
    .url("SUPABASE_DB_URL must be a valid PostgreSQL connection string")
    .optional(),
  // AI Provider configuration
  AI_PROVIDER: z
    .enum(["mock", "openai", "gemini"])
    .default("mock")
    .optional(),
  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY is required when AI_PROVIDER=openai")
    .optional(),
  GEMINI_API_KEY: z
    .string()
    .min(1, "GEMINI_API_KEY is required when AI_PROVIDER=gemini")
    .optional(),
  PRODUCT_HUNT_TOKEN: z
    .string()
    .min(1, "PRODUCT_HUNT_TOKEN is required for Product Hunt integration")
    .optional(),
  TWITTER_BEARER_TOKEN: z
    .string()
    .min(1, "TWITTER_BEARER_TOKEN is required for Twitter integration")
    .optional(),
  INDIEHACKERS_API_KEY: z
    .string()
    .min(1, "INDIEHACKERS_API_KEY is required for IndieHackers integration")
    .optional(),
  // Stripe (optional — required only when billing endpoints are hit)
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, "STRIPE_SECRET_KEY is required for Stripe billing")
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, "STRIPE_WEBHOOK_SECRET is required for Stripe webhooks")
    .optional(),
  // Email (optional — required only when notifications are sent)
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required for email notifications")
    .optional(),
  // Cron auth (optional — required only when Vercel Cron hits /api/jobs/*)
  CRON_SECRET: z
    .string()
    .min(
      16,
      "CRON_SECRET must be at least 16 chars for cron endpoint security",
    )
    .optional(),
  // Reddit collector
  REDDIT_CLIENT_ID: z
    .string()
    .min(1, "REDDIT_CLIENT_ID is required for Reddit collector")
    .optional(),
  REDDIT_CLIENT_SECRET: z
    .string()
    .min(1, "REDDIT_CLIENT_SECRET is required for Reddit collector")
    .optional(),
  REDDIT_USER_AGENT: z
    .string()
    .min(1, "REDDIT_USER_AGENT is required for Reddit collector")
    .optional(),
  // Sentry (optional — error monitoring; off when DSN is empty)
  SENTRY_DSN: z
    .string()
    .url("SENTRY_DSN must be a valid Sentry DSN URL")
    .optional()
    .or(z.literal("")),
  SENTRY_AUTH_TOKEN: z
    .string()
    .min(1, "SENTRY_AUTH_TOKEN required for source map upload at build time")
    .optional()
    .or(z.literal("")),
  SENTRY_ORG: z
    .string()
    .min(1, "SENTRY_ORG required for source map upload at build time")
    .optional()
    .or(z.literal("")),
  SENTRY_PROJECT: z
    .string()
    .min(1, "SENTRY_PROJECT required for source map upload at build time")
    .optional()
    .or(z.literal("")),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = ServerEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
    AI_PROVIDER: process.env.AI_PROVIDER || "mock",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    PRODUCT_HUNT_TOKEN: process.env.PRODUCT_HUNT_TOKEN,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    INDIEHACKERS_API_KEY: process.env.INDIEHACKERS_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
    REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
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
