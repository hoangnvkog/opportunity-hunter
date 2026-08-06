/**
 * API route authentication guards
 *
 * Sprint 68 — Auth Hardening
 *
 * Three guards:
 *  - `requireUserAPI()` — requires a valid Supabase session cookie (USER routes)
 *  - `requireCronSecret()` — requires `x-cron-secret` header matching `CRON_SECRET` env (CRON routes)
 *  - `optionalUserAPI()` — returns user if present, null otherwise (for filters/preferences)
 *
 * Usage in a route:
 *
 *   export async function POST() {
 *     const guard = await requireUserAPI();
 *     if (!guard.ok) return guard.response;
 *     const { user } = guard;
 *     ...
 *   }
 *
 * The `ok: false | true` discriminator keeps routes branch-free and matches
 * the existing error-handling style of the codebase.
 */

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { setSentryUser } from "@/lib/sentry";
import type { User } from "@supabase/supabase-js";

export type ApiGuardSuccess = { ok: true; user: User };
export type ApiGuardFailure = { ok: false; response: NextResponse };
export type ApiGuardResult = ApiGuardSuccess | ApiGuardFailure;
export type OptionalUserResult = { user: User | null };

/**
 * Require an authenticated user. Returns a 401 NextResponse when no valid
 * session cookie is present. Use the returned `response` directly when
 * `ok` is false.
 */
export async function requireUserAPI(): Promise<ApiGuardResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  // Attach user to Sentry context (no-op when SENTRY_DSN is empty).
  setSentryUser({ id: user.id, email: user.email ?? null });

  return { ok: true, user };
}

/**
 * Optional user — never 401s. Use for endpoints that personalize output
 * when signed in but still serve anonymous traffic.
 */
export async function optionalUserAPI(): Promise<OptionalUserResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user: user ?? null };
}

/**
 * Require a valid `x-cron-secret` header. Compares against `CRON_SECRET`
 * env var using `crypto.timingSafeEqual` to avoid timing leaks. Returns
 * 503 when the secret is not configured (server misconfig) and 401 when
 * the header is missing or mismatched.
 */
export async function requireCronSecret(
  request: Request,
): Promise<ApiGuardResult> {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Misconfigured server — fail closed.
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Cron secret not configured" },
        { status: 503 },
      ),
    };
  }

  const provided = request.headers.get("x-cron-secret");
  if (!provided || provided.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Missing cron secret" },
        { status: 401 },
      ),
    };
  }

  // Constant-time comparison. Both buffers are the same length only when
  // lengths match, so we still need the explicit length check first.
  const expectedBuf = new TextEncoder().encode(expected);
  const providedBuf = new TextEncoder().encode(provided);
  if (expectedBuf.length !== providedBuf.length) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Invalid cron secret" },
        { status: 401 },
      ),
    };
  }

  const { timingSafeEqual } = await import("node:crypto");
  const ok = timingSafeEqual(expectedBuf, providedBuf);
  if (!ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Invalid cron secret" },
        { status: 401 },
      ),
    };
  }

  // Return a synthetic "user" so call-sites keep the same shape.
  return {
    ok: true,
    user: { id: "cron", email: "cron@system" } as User,
  };
}

/**
 * Convenience predicate for routes that want to short-circuit on the
 * failure object without destructuring.
 */
export function isGuardFailure(
  result: ApiGuardResult,
): result is ApiGuardFailure {
  return result.ok === false;
}
