/**
 * Sprint P010 — JavaScript / client-module budget checks (source heuristics).
 * Complements @next/bundle-analyzer (npm run analyze) for CI-friendly gates.
 *
 * Usage: npx tsx scripts/bundle-budget.mts
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

/** Soft ceilings for individual "use client" source modules (KB). */
const BUDGETS = {
  maxClientModuleKb: 16,
  maxBarrelClientKb: 2,
  warnClientModuleKb: 12,
} as const;

type ClientModule = { path: string; kb: number; bytes: number };

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) walk(full, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry)) out.push(full);
  }
  return out;
}

function isUseClient(file: string): boolean {
  try {
    return /^["']use client["']/m.test(readFileSync(file, "utf8"));
  } catch {
    return false;
  }
}

function rel(p: string): string {
  return p.replace(ROOT, "").replace(/\\/g, "/").replace(/^\//, "");
}

function main() {
  const files = walk(join(ROOT, "src"));
  const clients: ClientModule[] = [];

  for (const file of files) {
    if (!isUseClient(file)) continue;
    const bytes = statSync(file).size;
    clients.push({ path: rel(file), bytes, kb: Math.round((bytes / 1024) * 10) / 10 });
  }

  clients.sort((a, b) => b.bytes - a.bytes);

  const violations = clients.filter((c) => c.kb > BUDGETS.maxClientModuleKb);
  const warnings = clients.filter(
    (c) => c.kb > BUDGETS.warnClientModuleKb && c.kb <= BUDGETS.maxClientModuleKb
  );

  const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const hasAnalyze = Boolean(packageJson.scripts?.analyze);
  const hasBundleAnalyzer = Boolean(
    packageJson.devDependencies?.["@next/bundle-analyzer"] ||
      packageJson.dependencies?.["@next/bundle-analyzer"]
  );

  const report = {
    sprint: "P010",
    generatedAt: new Date().toISOString(),
    budgets: BUDGETS,
    totals: {
      clientModules: clients.length,
      violations: violations.length,
      warnings: warnings.length,
    },
    tooling: {
      analyzeScript: hasAnalyze,
      bundleAnalyzerDependency: hasBundleAnalyzer,
    },
    topClientModules: clients.slice(0, 25),
    violations,
    warnings: warnings.slice(0, 15),
    notes: [
      "Budgets are source-size heuristics for client islands (not gzipped route bundles).",
      "Run `npm run analyze` after a production build for webpack chunk graphs.",
      "Route-level dynamic() splits prevent unused panels from entering shared dashboard chunks.",
    ],
  };

  const outPath = join(ROOT, "perf-bundle-budget-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`P010 bundle budget → ${outPath}`);
  console.log(`Client modules: ${clients.length}`);
  console.log(`Over ${BUDGETS.maxClientModuleKb} KB: ${violations.length}`);
  console.log(`Analyze script: ${hasAnalyze ? "yes" : "NO"}`);
  console.log("\nTop 10 client modules:");
  for (const c of clients.slice(0, 10)) {
    console.log(`  ${String(c.kb).padStart(5)} KB  ${c.path}`);
  }

  if (!hasAnalyze || !hasBundleAnalyzer) {
    console.error("\nBudget tooling incomplete: add analyze script + @next/bundle-analyzer.");
    process.exitCode = 1;
  }

  // Soft gate: do not fail CI on historical large islands yet; report only.
  if (violations.length) {
    console.log(
      `\nNote: ${violations.length} client module(s) exceed ${BUDGETS.maxClientModuleKb} KB soft budget (tracked, non-blocking).`
    );
  }
}

main();
