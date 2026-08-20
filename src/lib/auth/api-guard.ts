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
 * Require a valid cron secret header. Accepts BOTH:
 *   - `Authorization: Bearer <CRON_SECRET>` (Vercel Cron default; Vercel
 *     automatically sends `CRON_SECRET` env as a bearer token when the
 *     env var is set on the project.)
 *   - `x-cron-secret: <CRON_SECRET>` (manual trigger / non-Vercel schedulers)
 *
 * Compares with `crypto.timingSafeEqual` to avoid timing leaks.
 *
 * Returns:
 *   - 503 when `CRON_SECRET` env is missing (server misconfig — fail closed)
 *   - 401 when header is missing, length mismatches, or value mismatches
 *   - ok=true with a synthetic `{ id: "cron" }` user otherwise
 *
 * NOTE on Vercel Cron behaviour: when `CRON_SECRET` env is set, Vercel
 * automatically includes `Authorization: Bearer <CRON_SECRET>` on every
 * cron invocation. No `vercel.json` header config needed.
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

  // Prefer Authorization: Bearer (Vercel standard). Fall back to x-cron-secret.
  let provided: string | null = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    provided = authHeader.slice("bearer ".length).trim();
  } else {
    provided = request.headers.get("x-cron-secret");
  }

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

/**
 * Server action guard (Sprint 73).
 *
 * Server actions cannot return a `NextResponse` directly — they are
 * serialised through Next.js's action runtime. When a server action
 * throws an unhandled exception, the client sees a generic
 * "An unexpected response was received from the server." error, which
 * is impossible to debug end-to-end.
 *
 * This helper does two things:
 *  1. Reads the current Supabase user (server-side, via cookie).
 *  2. Returns a discriminated `{ user } | { error }` so the action
 *     can short-circuit with a structured response.
 *
 * Usage in a server action:
 *
 *   "use server";
 *   export async function generateEvidenceAction(opportunityId: string) {
 *     const auth = await requireUserAction();
 *     if (!auth.ok) return { success: false, error: auth.error };
 *     // ... continue, mutations scoped to auth.user
 *   }
 *
 * IMPORTANT: callers should NOT throw on `!auth.ok`. Returning a
 * structured `{ success: false, error }` keeps the action response
 * JSON-parseable on the client and avoids the Next.js 5xx wrap.
 */
export type ActionAuthSuccess = { ok: true; user: User };
export type ActionAuthFailure = { ok: false; error: string };
export type ActionAuthResult = ActionAuthSuccess | ActionAuthFailure;

export async function requireUserAction(): Promise<ActionAuthResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  setSentryUser({ id: user.id, email: user.email ?? null });

  return { ok: true, user };
}
