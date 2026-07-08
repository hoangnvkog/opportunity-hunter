/**
 * Tests for check-cli-imports.ts
 *
 * Verifies the boundary checker catches forbidden imports in CLI/pipeline
 * files. Runs as a vitest test so `npm run test` enforces the rule.
 */

import * as fs from "fs";
import * as path from "path";
import { describe, it, expect } from "vitest";
import { runCheck } from "../check-cli-imports";

const ROOT = path.resolve(__dirname, "../../..");

// ── Helpers ───────────────────────────────────────────────────────────

function createTempFile(relPath: string, content: string): string {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf-8");
  return full;
}

function cleanup(relPath: string) {
  const full = path.join(ROOT, relPath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("check-cli-imports boundary checker", { timeout: 60_000 }, () => {
  it("passes on the current clean codebase", () => {
    const result = runCheck(ROOT);
    expect(result.pass).toBe(true);
    expect(result.scannedCount).toBeGreaterThan(40);
  });

  it("catches static import of 'next/headers' in a pipeline service", () => {
    const file = "src/services/pipeline/_tmp_test_violation.ts";
    createTempFile(file, 'import { cookies } from "next/headers";\nexport const x = 1;\n');
    try {
      const result = runCheck(ROOT);
      expect(result.pass).toBe(false);
      const match = result.direct.find((v) => v.file.includes("_tmp_test_violation"));
      expect(match).toBeDefined();
      expect(match!.specifier).toBe("next/headers");
    } finally {
      cleanup(file);
    }
  });

  it("catches 'import \"server-only\"' in a pipeline service", () => {
    const file = "src/services/evidence/_tmp_test_violation2.ts";
    createTempFile(file, 'import "server-only";\nexport const x = 1;\n');
    try {
      const result = runCheck(ROOT);
      expect(result.pass).toBe(false);
      const match = result.direct.find((v) => v.file.includes("_tmp_test_violation2"));
      expect(match).toBeDefined();
      expect(match!.specifier).toContain("server-only");
    } finally {
      cleanup(file);
    }
  });

  it("catches '@/lib/supabase/server' import in a job file", () => {
    const file = "src/jobs/_tmp_test_violation3.ts";
    createTempFile(
      file,
      'import { getSupabaseServerClient } from "@/lib/supabase/server";\nexport const x = 1;\n',
    );
    try {
      const result = runCheck(ROOT);
      expect(result.pass).toBe(false);
      const match = result.direct.find((v) => v.file.includes("_tmp_test_violation3"));
      expect(match).toBeDefined();
      expect(match!.specifier).toBe("@/lib/supabase/server");
    } finally {
      cleanup(file);
    }
  });

  it("catches dynamic await import of forbidden specifier", () => {
    const file = "src/jobs/_tmp_test_violation4.ts";
    createTempFile(file, 'const m = await import("server-only");\nexport const x = 1;\n');
    try {
      const result = runCheck(ROOT);
      expect(result.pass).toBe(false);
      const match = result.direct.find((v) => v.file.includes("_tmp_test_violation4"));
      expect(match).toBeDefined();
      expect(match!.specifier).toBe("server-only");
    } finally {
      cleanup(file);
    }
  });

  it("does NOT flag files outside scanned dirs", () => {
    const file = "src/app/_tmp_test_safe_violation.ts";
    createTempFile(file, 'import { cookies } from "next/headers";\nexport const x = 1;\n');
    try {
      const result = runCheck(ROOT);
      // src/app/ is not in SCANNED_DIRS — should pass
      expect(result.pass).toBe(true);
    } finally {
      cleanup(file);
    }
  });

  it("passes with clean pipeline files that import barrel supabase", () => {
    const file = "src/services/pipeline/_tmp_test_clean.ts";
    createTempFile(
      file,
      'import { getSupabaseServiceClient } from "@/lib/supabase";\nexport const x = 1;\n',
    );
    try {
      const result = runCheck(ROOT);
      expect(result.pass).toBe(true);
    } finally {
      cleanup(file);
    }
  });
});
