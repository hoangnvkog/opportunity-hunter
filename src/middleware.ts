/**
 * Edge middleware — applied to all requests.
 *
 * Responsibilities:
 *   1. Rate-limit expensive routes (`/api/pipeline`, `/api/research/jobs`)
 *      per identifier (user id if known, else IP). Uses a sliding-window
 *      in-memory bucket — see `src/lib/rate-limit.ts`.
 *
 *   Note: we deliberately keep this middleware MINIMAL. Adding
 *   auth-rewriting, redirects, or response rewriting here would force
 *   the entire app into the Edge runtime, which breaks Supabase server
 *   client + `cookies()`. Auth checks live inside route handlers.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";

function getClientIdentifier(request: NextRequest): string {
  // Prefer user id from cookie if present. The middleware can't call
  // `getUser()` (that's a Node API), but the Supabase access token
  // cookie is a stable per-user key — good enough for rate limit buckets.
  const userCookie = request.cookies.get("sb-access-token");
  if (userCookie?.value) {
    return `user:${userCookie.value.slice(0, 32)}`;
  }
  // Fallback to IP. Vercel sets `x-forwarded-for`; `request.ip` is
  // populated when running on Vercel Edge.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";
  return `ip:${ip}`;
}

function rateLimitResponse(result: {
  limit: number;
  remaining: number;
  reset: number;
}) {
  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      message: "Too many requests. Try again later.",
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000),
        ).toString(),
      },
    },
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Find the matching policy (longest prefix match).
  const matchedPolicy = Object.entries(RATE_LIMIT_POLICIES)
    .filter(([route]) => pathname === route || pathname.startsWith(`${route}/`))
    .sort(([a], [b]) => b.length - a.length)[0];

  if (!matchedPolicy) {
    return NextResponse.next();
  }

  const [route, policy] = matchedPolicy;
  const identifier = `${getClientIdentifier(request)}|${route}`;
  const result = rateLimit(identifier, policy);

  if (!result.success) {
    return rateLimitResponse(result);
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());
  return response;
}

export const config = {
  // Run only on API routes that have a rate limit policy.
  // Each route handler in `src/app/api/*` still has its own auth guard.
  matcher: ["/api/pipeline/:path*", "/api/research/jobs/:path*"],
};