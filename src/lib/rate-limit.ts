/**
 * Simple in-memory rate limiter (sliding window).
 *
 * Used by `src/middleware.ts` to protect expensive endpoints
 * (`/api/pipeline`) from accidental abuse or cost burn.
 *
 * Caveats:
 *   - State lives in process memory. On Vercel, each cold start
 *     resets the counters. For a single-instance deploy this is
 *     fine; for multi-region scale, swap to Upstash Redis
 *     (`@upstash/ratelimit`) — the interface is identical.
 *   - Counts are per (identifier, route). The middleware passes
 *     the user id (if authenticated) or IP (if anonymous) plus
 *     the matched pathname.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the window resets. */
  reset: number;
}

export interface RateLimitConfig {
  /** Max requests allowed in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Returns true if the identifier is allowed `config.limit` requests
 * per `config.windowMs`. Mutates the in-memory store.
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(identifier);

  // Cold bucket OR expired window → start fresh.
  if (!existing || now > existing.resetAt) {
    const resetAt = now + config.windowMs;
    buckets.set(identifier, { count: 1, resetAt });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: resetAt,
    };
  }

  if (existing.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: existing.resetAt,
    };
  }

  existing.count += 1;
  buckets.set(identifier, existing);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - existing.count,
    reset: existing.resetAt,
  };
}

/**
 * Per-route rate limit policies. The matcher on the route is the
 * unique key — adding a new policy is a one-liner.
 */
export const RATE_LIMIT_POLICIES: Record<
  string,
  { limit: number; windowMs: number; description: string }
> = {
  "/api/pipeline": {
    // Pipeline run is expensive (multi-stage AI calls, ~$0.50–$2/run).
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    description: "Pipeline runs: 10/hour per identifier",
  },
  "/api/research/jobs": {
    // Research job also kicks off async work + external API calls.
    limit: 20,
    windowMs: 60 * 60 * 1000,
    description: "Research jobs: 20/hour per identifier",
  },
};

/** Test-only helper. Resets all counters between vitest runs. */
export function _resetRateLimitStore(): void {
  buckets.clear();
}