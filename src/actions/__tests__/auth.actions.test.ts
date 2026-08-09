/**
 * Tests for `signOutClient()` server action — Sprint 72 follow-up.
 *
 * Bug: server-side `supabase.auth.signOut()` throws "An unexpected
 * response was received from the server." when the cookie jar is
 * already empty (e.g. the browser-side `client.auth.signOut()` ran
 * first in `UserMenu.handleSignOut`).
 *
 * Fix: `signOutClient()` now wraps `supabase.auth.signOut()` in
 * try/catch and returns `{ success: false, error: ... }` instead of
 * letting the exception escape to Next.js. This test pins the
 * never-throw contract.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// The mock function lives outside `vi.mock` so we can reconfigure it
// per-test (vi.mock factories are hoisted; we capture the mock through
// `vi.mocked()`).
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(() => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}));

import { signOutClient } from "../auth.actions";

describe("signOutClient", () => {
  beforeEach(() => {
    mockSignOut.mockReset();
  });

  it("returns success:true when Supabase signOut succeeds", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const result = await signOutClient();
    expect(result).toEqual({ success: true });
  });

  it("returns success:false when Supabase returns an error", async () => {
    mockSignOut.mockResolvedValue({
      error: { message: "Auth session missing!" },
    });
    const result = await signOutClient();
    expect(result).toEqual({
      success: false,
      error: "Auth session missing!",
    });
  });

  it("catches Supabase SDK throws (e.g. 'unexpected response')", async () => {
    // Simulate the real-world bug: cookie jar was already cleared by the
    // browser-side `client.auth.signOut()` in UserMenu, so the
    // server-side signOut throws when it tries to hit /auth/v1/logout
    // without a session token.
    mockSignOut.mockRejectedValue(
      new Error("An unexpected response was received from the server."),
    );
    const result = await signOutClient();
    expect(result.success).toBe(false);
    expect(result.error).toContain("unexpected response");
  });

  it("catches non-Error throws", async () => {
    mockSignOut.mockRejectedValue("string error");
    const result = await signOutClient();
    expect(result).toEqual({ success: false, error: "Sign out failed" });
  });

  it("NEVER throws (pin the contract)", async () => {
    mockSignOut.mockRejectedValue(new Error("boom"));
    await expect(signOutClient()).resolves.toBeDefined();
    mockSignOut.mockRejectedValue(undefined);
    await expect(signOutClient()).resolves.toBeDefined();
    mockSignOut.mockImplementation(() => {
      throw new Error("sync throw");
    });
    await expect(signOutClient()).resolves.toBeDefined();
  });
});
