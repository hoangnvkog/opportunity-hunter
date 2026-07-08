#!/usr/bin/env tsx
/**
 * CLI Import Boundary Checker
 *
 * Scans CLI entrypoints + pipeline services to ensure no one imports
 * Next.js runtime modules ("next/headers", "next/cache", "server-only",
 * "@/lib/supabase/server", etc.) — which throw at runtime in Node/CLI.
 *
 * Uses the TypeScript Compiler API (already in devDependencies) to walk
 * the AST, so path aliases like "@/..." are resolved correctly.
 *
 * Run:  npm run check:cli-imports
 * Or:   npx tsx src/scripts/check-cli-imports.ts
 */

import ts from "typescript";
import * as path from "path";
import * as fs from "fs";

// ── Config ────────────────────────────────────────────────────────────

/**
 * Directories to scan — CLI entrypoints + every service that can run
 * inside a pipeline / background job (NOT inside App Router).
 */
const SCANNED_DIRS = [
  "src/scripts",
  "src/jobs",
  "src/services/pipeline",
  "src/services/market-intelligence",
  "src/services/startup-score",
  "src/services/venture-report",
  "src/services/investment-memo",
  "src/services/investment-committee",
  "src/services/evidence",
  "src/services/forecasts",
  "src/services/validation",
  "src/services/sources",
  "src/services/matching",
  "src/services/email",
];

/** Forbidden import specifiers — substring match on the import path text */
const FORBIDDEN_IMPORTS = [
  "next/headers",
  "next/cache",
  "next/router",
  "next/navigation",
  "server-only",
  "client-only",
  "@/lib/supabase/server",
  "@/lib/env.server",
  "@/lib/auth/server",
  "@/services/alerts/alerts.service",
  "@/services/watchlists/watchlists.service",
  "@/services/auth/auth.service",
  "@/services/system/health.service",
];

/**
 * Forbidden file path substrings — if ANY resolved file in the import
 * chain contains this string, it's a violation. (Applied during
 * recursive chain walk, not during the direct-scan pass.)
 */
const FORBIDDEN_PATHS = [
  "/app/",         // App Router pages — server-only via React context
  "/actions/",     // Server Actions — uses cookies()
  "/components/",  // Client components — "use client"
];

// ── Glob expansion (recursive readdir, no external glob lib) ──────────

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsFiles(full));
      continue;
    }
    if (
      !entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".tsx")
    ) continue;
    if (
      entry.name.endsWith(".test.ts") ||
      entry.name.endsWith(".test.tsx") ||
      entry.name.endsWith(".d.ts")
    ) continue;
    out.push(full);
  }
  return out;
}

/** Resolve SCANNED_DIRS → absolute file paths. Always re-reads disk. */
function collectAllFiles(root: string): string[] {
  const files: string[] = [];
  for (const dir of SCANNED_DIRS) {
    files.push(...collectTsFiles(path.join(root, dir)));
  }
  return [...new Set(files)];
}

// ── TS Program creation ──────────────────────────────────────────────

function createProgram(root: string, extraFiles: string[]): ts.Program {
  const configPath = path.join(root, "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    root,
  );
  const all = [...new Set([...parsed.fileNames, ...extraFiles])];

  return ts.createProgram(all, {
    ...parsed.options,
    noEmit: true,
    skipLibCheck: true,
    noResolve: false,
  });
}

// ── Resolve a single import specifier to a file path ──────────────────

function resolveModule(
  specifier: string,
  containingFile: string,
  compilerOptions: ts.CompilerOptions,
): string | null {
  const result = ts.resolveModuleName(
    specifier,
    containingFile,
    compilerOptions,
    ts.sys,
  );
  if (result.resolvedModule) {
    return result.resolvedModule.resolvedFileName;
  }
  return null;
}

// ── Extract all import specifiers from a SourceFile (static + dynamic) ─
// Uses a recursive walker because await-import() is nested inside
// VariableStatement → DeclarationList → Declaration → Initializer.

function walkNode(
  node: ts.Node,
  sf: ts.SourceFile,
  out: { node: ts.Node; spec: string }[],
) {
  // import ... from "X"
  if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
    if (ts.isStringLiteral(node.moduleSpecifier)) {
      out.push({ node, spec: node.moduleSpecifier.text });
    }
    return; // don't recurse into children
  }
  // export ... from "X"
  if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
    if (ts.isStringLiteral(node.moduleSpecifier)) {
      out.push({ node, spec: node.moduleSpecifier.text });
    }
    return;
  }
  // import("X") — bare dynamic import
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(sf) === "import" &&
    node.arguments[0] &&
    ts.isStringLiteral(node.arguments[0])
  ) {
    out.push({ node, spec: node.arguments[0].text });
    return;
  }
  // await import("X") — nested inside variable declarations etc.
  if (
    ts.isAwaitExpression(node) &&
    ts.isCallExpression(node.expression) &&
    node.expression.expression.getText(sf) === "import"
  ) {
    const arg = node.expression.arguments[0];
    if (arg && ts.isStringLiteral(arg)) {
      out.push({ node, spec: arg.text });
      return;
    }
  }
  // Recurse into children
  ts.forEachChild(node, (child) => walkNode(child, sf, out));
}

function getImportSpecifiers(sf: ts.SourceFile): { node: ts.Node; spec: string }[] {
  const out: { node: ts.Node; spec: string }[] = [];
  walkNode(sf, sf, out);
  return out;
}

// ── Direct scan (check each scanned file's own imports) ──────────────

interface Violation {
  file: string;
  line: number;
  specifier: string;
  rule: string;
}

function directScan(
  root: string,
  files: string[],
  program: ts.Program,
): Violation[] {
  const violations: Violation[] = [];
  for (const filePath of files) {
    const sf = program.getSourceFile(filePath);
    if (!sf) continue;

    for (const { node, spec } of getImportSpecifiers(sf)) {
      const matched = FORBIDDEN_IMPORTS.find((f) => spec.includes(f));
      if (!matched) continue;

      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      violations.push({
        file: path.relative(root, filePath),
        line: line + 1,
        specifier: spec,
        rule: matched,
      });
    }
  }
  return violations;
}

// ── Chain walk (follow imports recursively, flag forbidden files) ────

interface ChainViolation {
  origin: string;
  file: string;
  line: number;
  rule: string;
}

function chainWalk(
  root: string,
  files: string[],
  program: ts.Program,
): ChainViolation[] {
  const violations: ChainViolation[] = [];
  const visited = new Set<string>();
  const opts = program.getCompilerOptions();
  const rootSrc = path.normalize(root + "/src");

  const walk = (filePath: string, origin: string) => {
    const normalized = path.normalize(filePath);
    if (visited.has(normalized)) return;
    visited.add(normalized);

    const rel = path.relative(root, normalized);

    for (const pattern of FORBIDDEN_PATHS) {
      if (rel.includes(pattern)) {
        violations.push({ origin, file: rel, line: 1, rule: pattern });
        return;
      }
    }

    if (!normalized.startsWith(rootSrc)) return;

    const sf = program.getSourceFile(normalized);
    if (!sf) return;

    for (const { spec } of getImportSpecifiers(sf)) {
      const resolved = resolveModule(spec, normalized, opts);
      if (resolved && path.normalize(resolved).startsWith(rootSrc)) {
        walk(resolved, origin);
      }
    }
  };

  for (const f of files) walk(path.normalize(f), path.relative(root, f));
  return violations;
}

// ── Public API (used by tests) ────────────────────────────────────────

export interface CheckResult {
  pass: boolean;
  direct: Violation[];
  chain: ChainViolation[];
  scannedCount: number;
}

/**
 * Run the boundary check. Returns a structured result (no process.exit).
 * The CLI entrypoint calls this and sets the exit code.
 */
export function runCheck(root: string): CheckResult {
  const files = collectAllFiles(root);
  const program = createProgram(root, files);

  const direct = directScan(root, files, program);
  const chain = chainWalk(root, files, program);

  return {
    pass: direct.length === 0 && chain.length === 0,
    direct,
    chain,
    scannedCount: files.length,
  };
}

// ── CLI entrypoint ────────────────────────────────────────────────────

function main() {
  const root = path.resolve(__dirname, "../..");
  const result = runCheck(root);

  console.log(`[check-cli-imports] Scanning ${result.scannedCount} files...\n`);

  let exitCode = 0;

  if (result.direct.length > 0) {
    console.error("❌ FORBIDDEN IMPORTS FOUND IN CLI/PIPELINE FILES:\n");
    for (const v of result.direct) {
      console.error(`  ${v.file}:${v.line}  →  imports "${v.specifier}"`);
      console.error(`    Rule matched: ${v.rule}\n`);
    }
    exitCode = 1;
  }

  if (result.chain.length > 0) {
    console.error("❌ FORBIDDEN FILES IN CLI/PIPELINE IMPORT CHAIN:\n");
    for (const v of result.chain) {
      console.error(
        `  ${v.origin}  →  chain reaches forbidden file ${v.file} (via pattern: ${v.rule})`,
      );
    }
    console.error("");
    exitCode = 1;
  }

  if (exitCode === 0) {
    console.log(`✅ All ${result.scannedCount} files clean — no forbidden imports.`);
  } else {
    const total = result.direct.length + result.chain.length;
    console.error(
      `[check-cli-imports] ${total} violation(s). ` +
        "These will crash at CLI runtime with:\n" +
        '  "This module cannot be imported from a Client Component module."\n',
    );
    console.error(
      "Fix: remove the import, or move the code into a Next-only path.\n",
    );
  }

  process.exit(exitCode);
}

// Only run when executed directly (not when imported by tests)
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) main();
