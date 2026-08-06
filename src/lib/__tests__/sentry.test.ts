import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @sentry/nextjs
const mockSentry = {
  setUser: vi.fn(),
  setContext: vi.fn(),
  setTags: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
};

vi.mock("@sentry/nextjs", () => mockSentry);

describe("sentry helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("setSentryUser calls Sentry.setUser with the user", async () => {
    const { setSentryUser } = await import("@/lib/sentry");
    setSentryUser({ id: "u1", email: "u@test.com" });
    expect(mockSentry.setUser).toHaveBeenCalledWith({
      id: "u1",
      email: "u@test.com",
    });
  });

  it("setSentryUser(null) clears the user", async () => {
    const { setSentryUser } = await import("@/lib/sentry");
    setSentryUser(null);
    expect(mockSentry.setUser).toHaveBeenCalledWith(null);
  });

  it("setSentryContext calls Sentry.setContext", async () => {
    const { setSentryContext } = await import("@/lib/sentry");
    setSentryContext("opportunity", { id: "opp-1" });
    expect(mockSentry.setContext).toHaveBeenCalledWith("opportunity", {
      id: "opp-1",
    });
  });

  it("captureWithContext sends context, tags, and the error", async () => {
    const { captureWithContext } = await import("@/lib/sentry");
    const err = new Error("boom");
    captureWithContext(err, {
      context: { opportunity: { id: "opp-1" } },
      tags: { stage: "extract" },
      level: "warning",
    });

    expect(mockSentry.setContext).toHaveBeenCalledWith("opportunity", {
      id: "opp-1",
    });
    expect(mockSentry.setTags).toHaveBeenCalledWith({ stage: "extract" });
    expect(mockSentry.captureException).toHaveBeenCalledWith(err, {
      level: "warning",
    });
  });

  it("captureWithContext works with no opts", async () => {
    const { captureWithContext } = await import("@/lib/sentry");
    const err = new Error("just an error");
    captureWithContext(err);

    expect(mockSentry.captureException).toHaveBeenCalledWith(err, {
      level: "error",
    });
    expect(mockSentry.setContext).not.toHaveBeenCalled();
    expect(mockSentry.setTags).not.toHaveBeenCalled();
  });

  it("does not throw when @sentry/nextjs throws", async () => {
    // Re-mock to make setUser throw — the helper must swallow it.
    mockSentry.setUser.mockImplementationOnce(() => {
      throw new Error("Sentry unavailable");
    });

    const { setSentryUser } = await import("@/lib/sentry");
    expect(() => setSentryUser({ id: "u1" })).not.toThrow();
  });
});