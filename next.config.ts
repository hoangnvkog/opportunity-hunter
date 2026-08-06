import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Sentry tunneling — keeps errors from being blocked by ad-blockers.
  // Next.js will proxy these requests to Sentry directly.
  experimental: {
    // Empty for now — reserved for future opt-in flags
  },
};

// Sentry requires NODE_ENV to be set. Default to production for build steps.
const sentryOptions = {
  // Disable Sentry during build (no DSN, no auth token)
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Don't fail builds if Sentry is misconfigured
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

// Only wrap if Sentry is enabled (DSN present)
const hasSentry = Boolean(process.env.SENTRY_DSN);

export default hasSentry
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;