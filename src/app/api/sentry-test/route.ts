// Test endpoint for Sentry error capture.
// GET /api/sentry-test → throws an error → Sentry captures it.
//
// Only enabled in development or when SENTRY_TEST_ENABLED=1.
// In production without the flag, returns 404.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  // Guard: only run when explicitly enabled.
  const enabled =
    process.env.NODE_ENV !== "production" ||
    process.env.SENTRY_TEST_ENABLED === "1";

  if (!enabled) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Capture a synthetic exception.
  Sentry.captureMessage(
    "Sentry test message from /api/sentry-test",
    "info",
  );

  try {
    throw new Error(
      "Synthetic Sentry test error from /api/sentry-test (delete this route after verifying).",
    );
  } catch (err) {
    Sentry.captureException(err);
    // Return 200 so curl sees success — Sentry still receives the event.
    return NextResponse.json({
      sentry_enabled: Boolean(process.env.SENTRY_DSN),
      captured: true,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}