/**
 * RC-1 — performance regression gate for CI.
 * Fails when bundle budgets exceed baselines or tooling is incomplete.
 * Optionally compares live metric snapshots when PERF_REGRESSION_METRICS_JSON is set.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const ROOT = process.cwd();

type Baselines = {
  version: number;
  budgets: {
    maxClientModuleKb: number;
    maxBundleViolations: number;
    maxHttpP95Ms: number;
    maxDbP95Ms: number;
    maxRumLcpP95Ms: number;
  };
};

function main() {
  const baselinePath = join(ROOT, "perf-baselines.json");
  if (!existsSync(baselinePath)) {
    console.error("Missing perf-baselines.json");
    process.exit(1);
  }
  const baselines = JSON.parse(readFileSync(baselinePath, "utf8")) as Baselines;

  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const budget = spawnSync(npmCmd, ["run", "bundle:budget"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  process.stdout.write(budget.stdout ?? "");
  process.stderr.write(budget.stderr ?? "");

  const reportPath = join(ROOT, "perf-bundle-budget-report.json");
  if (!existsSync(reportPath)) {
    console.error("bundle-budget did not produce perf-bundle-budget-report.json");
    process.exit(1);
  }

  const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
    totals: { violations: number };
    budgets: { maxClientModuleKb: number };
    tooling: { analyzeScript: boolean; bundleAnalyzerDependency: boolean };
  };

  const failures: string[] = [];

  if (report.totals.violations > baselines.budgets.maxBundleViolations) {
    failures.push(
      `Bundle violations ${report.totals.violations} > baseline ${baselines.budgets.maxBundleViolations}`
    );
  }
  if (report.budgets.maxClientModuleKb > baselines.budgets.maxClientModuleKb) {
    failures.push(
      `maxClientModuleKb budget ${report.budgets.maxClientModuleKb} > baseline ${baselines.budgets.maxClientModuleKb}`
    );
  }
  if (!report.tooling.analyzeScript || !report.tooling.bundleAnalyzerDependency) {
    failures.push("Bundle analyze tooling incomplete");
  }

  // Optional live metrics comparison (post-deploy / long-lived process).
  const metricsPath = process.env.PERF_REGRESSION_METRICS_JSON;
  if (metricsPath && existsSync(metricsPath)) {
    const metrics = JSON.parse(readFileSync(metricsPath, "utf8")) as {
      latency?: { http?: { p95?: number }; database?: { p95?: number } };
      rum?: { lcp?: { p95?: number } };
    };
    const httpP95 = metrics.latency?.http?.p95 ?? 0;
    const dbP95 = metrics.latency?.database?.p95 ?? 0;
    const lcpP95 = metrics.rum?.lcp?.p95 ?? 0;
    if (httpP95 > baselines.budgets.maxHttpP95Ms) {
      failures.push(`HTTP p95 ${httpP95}ms > ${baselines.budgets.maxHttpP95Ms}ms`);
    }
    if (dbP95 > baselines.budgets.maxDbP95Ms) {
      failures.push(`DB p95 ${dbP95}ms > ${baselines.budgets.maxDbP95Ms}ms`);
    }
    if (lcpP95 > baselines.budgets.maxRumLcpP95Ms) {
      failures.push(`RUM LCP p95 ${lcpP95}ms > ${baselines.budgets.maxRumLcpP95Ms}ms`);
    }
  }

  const out = {
    sprint: "RC-1",
    generatedAt: new Date().toISOString(),
    baselines: baselines.budgets,
    failures,
    ok: failures.length === 0,
  };
  writeFileSync(join(ROOT, "perf-regression-report.json"), JSON.stringify(out, null, 2));

  if (failures.length) {
    console.error("\nRC-1 performance regression FAILED:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  // Soft: historical large islands may still warn inside bundle-budget without failing.
  // RC-1 hard-fails only when violation count exceeds baseline (currently 0).
  if (budget.status && budget.status !== 0) {
    console.error("bundle-budget exited non-zero");
    process.exit(budget.status);
  }

  console.log("\nRC-1 performance regression OK");
}

main();
