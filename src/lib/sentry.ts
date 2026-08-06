// Sentry helper — light wrapper around @sentry/nextjs to make it easy
// to add user / opportunity context without importing @sentry/nextjs
// everywhere.
//
// Usage:
//   import { setSentryUser, captureWithContext } from "@/lib/sentry";
//   setSentryUser({ id: user.id, email: user.email });
//   captureWithContext(error, { opportunity: { id } });

import * as Sentry from "@sentry/nextjs";

/**
 * Set the user context for Sentry. Call after authentication succeeds.
 * Safe to call when Sentry is disabled (DSN missing) — it's a no-op.
 */
export function setSentryUser(
  user: { id: string; email?: string | null } | null,
): void {
  try {
    Sentry.setUser(
      user
        ? { id: user.id, email: user.email ?? undefined }
        : null,
    );
  } catch {
    // Sentry not initialized — silently ignore.
  }
}

/**
 * Set arbitrary context (e.g. opportunity, pipeline run, request id).
 * Safe to call when Sentry is disabled.
 */
export function setSentryContext(
  key: string,
  context: Record<string, unknown>,
): void {
  try {
    Sentry.setContext(key, context);
  } catch {
    // ignore
  }
}

/**
 * Capture an exception with optional context and tags.
 * Safe to call when Sentry is disabled.
 */
export function captureWithContext(
  error: unknown,
  opts?: {
    context?: Record<string, Record<string, unknown>>;
    tags?: Record<string, string>;
    level?: "fatal" | "error" | "warning" | "info" | "debug";
  },
): void {
  try {
    if (opts?.context) {
      for (const [key, value] of Object.entries(opts.context)) {
        Sentry.setContext(key, value);
      }
    }
    if (opts?.tags) {
      Sentry.setTags(opts.tags);
    }
    Sentry.captureException(error, { level: opts?.level ?? "error" });
  } catch {
    // ignore
  }
}