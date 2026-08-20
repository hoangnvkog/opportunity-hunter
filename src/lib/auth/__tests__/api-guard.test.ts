/**
 * Tests for `requireCronSecret` and `requireUserAction` — Sprint 68 Phase 1
 * hardening + Sprint 73 server-action guard.
 *
 * The global vitest setup (`src/test/setup.ts`) auto-mocks
 * `@/lib/auth/api-guard` for routes that call it indirectly. We override
 * that mock here so we can exercise the real implementation.
 *
 * Covers:
 *  - Server misconfig (CRON_SECRET env missing) → 503
 *  - Missing Authorization header + missing x-cron-secret → 401
 *  - Wrong-length bearer → 401
 *  - Wrong bearer → 401 (constant-time compare)
 *  - Vercel-style `Authorization: Bearer <CRON_SECRET>` → ok
 *  - Manual `x-cron-secret: <CRON_SECRET>` → ok
 *  - Reject x-cron-secret wrong value
 *  - requireUserAction returns structured auth result (Sprint 73):
 *    - no user → ok=false with error string
 *    - user    → ok=true with user object
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Override the global auto-mock with the real implementation. Must come
// before any import that resolves to this module path.
vi.mock("@/lib/auth/api-guard", async () => {
  const actual = await vi.importActual<typeof import("../api-guard")>(
    "../api-guard",
  );
  return actual;
});

import { requireCronSecret, requireUserAction } from "../api-guard";

// Mock the Supabase server client so requireUserAction can be exercised
// without booting the real Next.js cookies() runtime.
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

function makeRequest(opts: {
  auth?: string | null;
  customHeader?: string | null;
} = {}): Request {
  const headers: Record<string, string> = {};
  if (opts.auth !== undefined && opts.auth !== null) {
    headers["authorization"] = opts.auth;
  }
  if (opts.customHeader !== undefined && opts.customHeader !== null) {
    headers["x-cron-secret"] = opts.customHeader;
  }
  return new Request("http://localhost/test", { headers });
}

describe("requireCronSecret", () => {
  beforeEach(() => {
    if (ORIGINAL_CRON_SECRET === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    }
  });

  it("returns 503 when CRON_SECRET env is missing (server misconfig)", async () => {
    delete process.env.CRON_SECRET;
    const guard = await requireCronSecret(makeRequest({ auth: "Bearer x" }));

    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.response.status).toBe(503);
      const body = await guard.response.json();
      expect(body.error).toMatch(/not configured/i);
    }
  });

  it("returns 401 when no auth header is provided", async () => {
    process.env.CRON_SECRET = "a".repeat(32);
    const guard = await requireCronSecret(makeRequest());

    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.response.status).toBe(401);
      const body = await guard.response.json();
      expect(body.error).toMatch(/missing/i);
    }
  });

  it("returns 401 when bearer length does not match secret length", async () => {
    process.env.CRON_SECRET = "a".repeat(32);
    const guard = await requireCronSecret(makeRequest({ auth: "Bearer short" }));

    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.response.status).toBe(401);
      const body = await guard.response.json();
      expect(body.error).toMatch(/invalid/i);
    }
  });

  it("returns 401 when bearer value does not match (constant-time)", async () => {
    process.env.CRON_SECRET = "a".repeat(32);
    const wrong = "b".repeat(32);
    const guard = await requireCronSecret(makeRequest({ auth: `Bearer ${wrong}` }));

    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.response.status).toBe(401);
      const body = await guard.response.json();
      expect(body.error).toMatch(/invalid/i);
    }
  });

  it("accepts Vercel-style `Authorization: Bearer <CRON_SECRET>`", async () => {
    const secret = "v".repeat(32);
    process.env.CRON_SECRET = secret;
    const guard = await requireCronSecret(makeRequest({ auth: `Bearer ${secret}` }));

    expect(guard.ok).toBe(true);
    if (guard.ok) {
      expect(guard.user.id).toBe("cron");
    }
  });

  it("accepts manual `x-cron-secret: <CRON_SECRET>` for non-Vercel schedulers", async () => {
    const secret = "m".repeat(32);
    process.env.CRON_SECRET = secret;
    const guard = await requireCronSecret(makeRequest({ customHeader: secret }));

    expect(guard.ok).toBe(true);
    if (guard.ok) {
      expect(guard.user.id).toBe("cron");
    }
  });

  it("rejects x-cron-secret with wrong value", async () => {
    process.env.CRON_SECRET = "a".repeat(32);
    const guard = await requireCronSecret(makeRequest({ customHeader: "y".repeat(32) }));

    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.response.status).toBe(401);
    }
  });

  it("prefers Authorization header when both are present", async () => {
    const secret = "c".repeat(32);
    process.env.CRON_SECRET = secret;
    const guard = await requireCronSecret(
      makeRequest({ auth: `Bearer ${secret}`, customHeader: "wrong".repeat(5) + "z" }),
    );

    // Authorization is correct → should succeed regardless of x-cron-secret.
    expect(guard.ok).toBe(true);
  });
});

describe("requireUserAction (Sprint 73)", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it("returns ok=false with error string when no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const auth = await requireUserAction();

    expect(auth.ok).toBe(false);
    if (!auth.ok) {
      expect(auth.error).toMatch(/unauthorized/i);
    }
  });

  it("returns ok=false when getUser reports an error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("JWT expired"),
    });

    const auth = await requireUserAction();

    expect(auth.ok).toBe(false);
    if (!auth.ok) {
      expect(auth.error).toMatch(/unauthorized/i);
    }
  });

  it("returns ok=true with user when session is valid", async () => {
    const fakeUser = {
      id: "user-123",
      email: "q@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00Z",
      role: "authenticated",
      updated_at: "2026-01-01T00:00:00Z",
    };
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const auth = await requireUserAction();

    expect(auth.ok).toBe(true);
    if (auth.ok) {
      expect(auth.user.id).toBe("user-123");
      expect(auth.user.email).toBe("q@example.com");
    }
  });
});
