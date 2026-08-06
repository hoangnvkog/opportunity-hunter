import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  rateLimit,
  _resetRateLimitStore,
  RATE_LIMIT_POLICIES,
} from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    _resetRateLimitStore();
    vi.useRealTimers();
  });

  it("allows first request in a fresh window", () => {
    const result = rateLimit("user:abc", { limit: 10, windowMs: 60_000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("blocks requests over the limit", () => {
    const config = { limit: 3, windowMs: 60_000 };
    rateLimit("user:abc", config);
    rateLimit("user:abc", config);
    rateLimit("user:abc", config);
    const fourth = rateLimit("user:abc", config);
    expect(fourth.success).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("tracks identifiers independently", () => {
    const config = { limit: 2, windowMs: 60_000 };
    rateLimit("user:a", config);
    rateLimit("user:a", config);
    const aThird = rateLimit("user:a", config);
    const bFirst = rateLimit("user:b", config);
    expect(aThird.success).toBe(false);
    expect(bFirst.success).toBe(true);
  });

  it("resets after window expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-06T10:00:00Z"));
    const config = { limit: 1, windowMs: 60_000 };

    rateLimit("user:abc", config);
    const blocked = rateLimit("user:abc", config);
    expect(blocked.success).toBe(false);

    // Advance past the window.
    vi.setSystemTime(new Date("2026-08-06T10:01:01Z"));
    const afterReset = rateLimit("user:abc", config);
    expect(afterReset.success).toBe(true);
  });

  it("policies declare expected limits", () => {
    expect(RATE_LIMIT_POLICIES["/api/pipeline"].limit).toBe(10);
    expect(RATE_LIMIT_POLICIES["/api/research/jobs"].limit).toBe(20);
  });
});