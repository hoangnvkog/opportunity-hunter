// Sentry server-side configuration — Next.js Node.js runtime
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",

  // Performance — sample 10% of transactions in production, 100% in dev.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Disable in development unless explicitly enabled.
  enabled: Boolean(SENTRY_DSN),

  // Send stack traces for errors but not for the entire trace
  sendDefaultPii: false,

  // Filter out noisy errors (e.g., known transient client errors).
  beforeSend(event) {
    // Don't send events that are pure client-validation errors
    if (
      event.exception?.values?.some((e) =>
        e.value?.includes("NEXT_NOT_FOUND") ||
        e.value?.includes("NEXT_REDIRECT")
      )
    ) {
      return null;
    }
    return event;
  },
});