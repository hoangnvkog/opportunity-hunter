import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Auto-mock `@/lib/auth/api-guard` for every test file.
//
// Route handlers (`/api/*/route.ts`) call `requireUserAPI()` which
// transitively imports `next/headers` → `cookies()`. Vitest runs test
// code outside a real request scope, so `cookies()` throws:
//
//   `cookies` was called outside a request scope
//
// We replace the entire module with a vi.fn that returns a successful
// `{ ok: true, user }` shape. Tests that need to exercise the
// `unauthorized` path can override per-test via
// `vi.mocked(requireUserAPI).mockResolvedValueOnce({ ok: false, response })`.
// ---------------------------------------------------------------------------
vi.mock("@/lib/auth/api-guard", () => ({
  requireUserAPI: vi.fn().mockResolvedValue({
    ok: true,
    user: {
      id: "test-user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00Z",
      role: "authenticated",
      updated_at: "2026-01-01T00:00:00Z",
    },
  }),
  optionalUserAPI: vi.fn().mockResolvedValue({
    user: {
      id: "test-user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00Z",
      role: "authenticated",
      updated_at: "2026-01-01T00:00:00Z",
    },
  }),
  requireCronSecret: vi.fn().mockResolvedValue({ ok: true }),
  // Sprint 73 — server-action guard. Tests that exercise individual
  // actions need an auth override; default to a successful session.
  requireUserAction: vi.fn().mockResolvedValue({
    ok: true,
    user: {
      id: "test-user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00Z",
      role: "authenticated",
      updated_at: "2026-01-01T00:00:00Z",
    },
  }),
}));

// ---------------------------------------------------------------------------
// Load `.env.local` (and `.env` fallback) into `process.env` BEFORE any
// application module is imported. This keeps `getPublicEnv()` /
// `getServiceEnv()` happy during module-level validation.
// ---------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";

function loadEnvFileOnce(file: string): void {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const root = path.resolve(__dirname, "..", "..");
loadEnvFileOnce(path.join(root, ".env.local"));
loadEnvFileOnce(path.join(root, ".env"));

// jsdom sets `window` for us, but the runtime guard in env.server.ts
// checks `typeof window !== "undefined"` — explicit assignment is
// cheap insurance.
if (typeof (globalThis as { window?: unknown }).window === "undefined") {
  (globalThis as { window: unknown }).window = undefined;
}
