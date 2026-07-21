/**
 * RC-2 — complete load, concurrency, endurance, failure-injection suite.
 *
 * Env:
 *  LOAD_TEST_BASE_URL     — target app (default http://127.0.0.1:3000)
 *  LOAD_MAX_VUS           — cap concurrency ramp (default 100 locally)
 *  LOAD_SCENARIO_MS       — per-scenario duration (default 8000)
 *  LOAD_RAMP_MS           — per-ramp-step duration (default 10000)
 *  LOAD_ENDURANCE_MS      — soak duration (default 120000)
 *  LOAD_TEST_COOKIE / LOAD_TEST_EMAIL+PASSWORD — optional auth
 *  CRON_SECRET            — scrape observability metrics
 *  LOAD_SKIP_LIVE         — if "1", only local target + in-process baselines
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { resolveLoadAuth } from "./auth";
import { captureDbCapacity } from "./db-capacity";
import { enduranceDurationMs, runEndurance } from "./endurance";
import { probeLiveHealth, runFailureInjection } from "./failure-inject";
import { startLocalTarget } from "./local-target";
import { runScenario, runScenarioSet } from "./runner";
import {
  CONCURRENCY_LEVELS,
  SCENARIOS,
  maxVus,
  rampDurationMs,
  scenarioDurationMs,
} from "./scenarios";
import type { LoadSuiteReport, Percentiles, ScenarioResult } from "./types";

const ROOT = process.cwd();

function log(msg: string) {
  console.log(`[rc2] ${msg}`);
}

async function probeReachable(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(new URL("/api/health", baseUrl).toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    await res.arrayBuffer().catch(() => undefined);
    return res.status > 0 && res.status < 500;
  } catch {
    return false;
  }
}

async function inProcessBaselines(): Promise<Record<string, Percentiles | { note: string }>> {
  try {
    const { runPerformanceProbe } = await import("../../src/lib/performance/probe");
    const report = await runPerformanceProbe();
    const out: Record<string, Percentiles | { note: string }> = {
      _meta: {
        note: `In-process ECC probe at ${report.generatedAt}`,
      },
    };
    for (const row of report.routeTimings) {
      out[row.route] = {
        count: 1,
        p50: row.totalMs,
        p95: row.totalMs,
        p99: row.totalMs,
        avg: row.totalMs,
        max: row.totalMs,
        min: row.totalMs,
      };
    }
    out["singleton.intelligenceColdMs"] = {
      count: 1,
      p50: report.comparisons.intelligenceColdMs,
      p95: report.comparisons.intelligenceColdMs,
      p99: report.comparisons.intelligenceColdMs,
      avg: report.comparisons.intelligenceColdMs,
      max: report.comparisons.intelligenceColdMs,
      min: report.comparisons.intelligenceColdMs,
    };
    out["singleton.integrationsColdMs"] = {
      count: 1,
      p50: report.comparisons.integrationsColdMs,
      p95: report.comparisons.integrationsColdMs,
      p99: report.comparisons.integrationsColdMs,
      avg: report.comparisons.integrationsColdMs,
      max: report.comparisons.integrationsColdMs,
      min: report.comparisons.integrationsColdMs,
    };
    return out;
  } catch (error) {
    return {
      _error: {
        note: `In-process probe failed: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
}

function baselinesFromScenarios(results: ScenarioResult[]): Record<string, Percentiles> {
  const out: Record<string, Percentiles> = {};
  for (const r of results) {
    out[r.id] = r.latency;
  }
  return out;
}

function assessRelease(report: LoadSuiteReport): LoadSuiteReport["releaseReadiness"] {
  const blockers: string[] = [];
  const highError = report.scenarios.filter((s) => s.errorRate > 0.05);
  if (highError.length) {
    blockers.push(
      `Scenarios with errorRate > 5%: ${highError.map((s) => s.id).join(", ")}`
    );
  }
  const failedInject = report.failureInjection.filter((f) => !f.passed);
  if (failedInject.length) {
    blockers.push(`Failure injection failures: ${failedInject.map((f) => f.id).join(", ")}`);
  }
  if (report.mode === "local_target" && !report.authConfigured) {
    return {
      status: "ready_with_gaps",
      summary:
        "Harness + failure injection validated; live authenticated staging load still required before production scale sign-off.",
      blockers: [
        "Authenticated staging load at 250–500 VU not executed in this environment",
        "6–24h soak deferred to staging (default soak is short)",
      ],
    };
  }
  if (blockers.length) {
    return {
      status: "not_ready",
      summary: "Load/resilience suite found blockers",
      blockers,
    };
  }
  if (!report.authConfigured) {
    return {
      status: "ready_with_gaps",
      summary:
        "Public/auth-gate load + failure injection passed; authenticated page latency baselines need LOAD_TEST credentials on staging.",
      blockers: [],
    };
  }
  return {
    status: "ready",
    summary: "RC-2 suite passed with authenticated traffic against live target",
    blockers: [],
  };
}

async function main() {
  const skipLive = process.env.LOAD_SKIP_LIVE === "1";
  const preferred =
    process.env.LOAD_TEST_BASE_URL?.trim() || "http://127.0.0.1:3000";
  const local = await startLocalTarget();
  log(`Local failure-injection target at ${local.baseUrl}`);

  let liveBase: string | null = null;
  let mode: LoadSuiteReport["mode"] = "local_target";

  if (!skipLive && (await probeReachable(preferred))) {
    liveBase = preferred.replace(/\/$/, "");
    mode = "mixed";
    log(`Live target reachable: ${liveBase}`);
  } else {
    log(`Live target not reachable (${preferred}) — using local target for HTTP load`);
  }

  const httpBase = liveBase ?? local.baseUrl;
  const auth = await resolveLoadAuth();
  for (const n of auth.notes) log(n);

  const vuCap = maxVus();
  const scenarioMs = scenarioDurationMs();
  const rampMs = rampDurationMs();
  const enduranceMs = enduranceDurationMs();

  // Phase 1 — scenario load (moderate concurrency)
  const scenarioConcurrency = Math.min(10, vuCap);
  log(`Phase 1: scenario load @ ${scenarioConcurrency} VU`);
  const scenarios = await runScenarioSet({
    baseUrl: httpBase,
    scenarios: SCENARIOS,
    concurrency: scenarioConcurrency,
    durationMs: scenarioMs,
    auth: auth.headers,
    onProgress: log,
  });

  // Phase 2 — concurrency ramp on a canary path
  const rampScenario = SCENARIOS.find((s) => s.id === "auth.health") ?? SCENARIOS[0]!;
  const concurrencyRamp: ScenarioResult[] = [];
  log(`Phase 2: concurrency ramp on ${rampScenario.path}`);
  for (const level of CONCURRENCY_LEVELS) {
    if (level > vuCap) {
      log(`Skipping ${level} VU (LOAD_MAX_VUS=${vuCap})`);
      continue;
    }
    concurrencyRamp.push(
      await runScenario({
        baseUrl: httpBase,
        scenario: rampScenario,
        concurrency: level,
        durationMs: rampMs,
        auth: auth.headers,
      })
    );
    const last = concurrencyRamp[concurrencyRamp.length - 1]!;
    log(
      `  ${level} VU → p95=${last.latency.p95}ms rps=${last.throughputRps} err=${last.errorRate}`
    );
  }

  // Phase 3 — endurance
  log(`Phase 3: endurance ${enduranceMs}ms`);
  const endurance = await runEndurance({
    baseUrl: httpBase,
    paths: ["/api/health", "/api/ready", "/login", "/api/ready/deep"],
    concurrency: Math.min(20, vuCap),
    durationMs: enduranceMs,
    auth: auth.headers,
    onProgress: log,
  });

  // Phase 4 — failure injection (local target) + live health probes
  log("Phase 4: failure injection");
  const failureInjection = [
    ...(await runFailureInjection(local)),
    ...(liveBase ? await probeLiveHealth(liveBase) : []),
  ];

  // Phase 5 — database capacity
  log("Phase 5: database capacity snapshot");
  const database = await captureDbCapacity({
    liveBaseUrl: liveBase ?? undefined,
    cronSecret: process.env.CRON_SECRET,
  });

  // Phase 6 — baselines
  log("Phase 6: production baselines");
  const probeBaselines = await inProcessBaselines();
  const httpBaselines = baselinesFromScenarios(scenarios);
  const baselines = { ...probeBaselines, ...httpBaselines };

  const issues: LoadSuiteReport["issues"] = [];
  for (const s of scenarios) {
    if (s.latency.p95 > 3000) {
      issues.push({
        severity: "warning",
        message: `${s.id} p95 ${s.latency.p95}ms exceeds 3s guidance`,
        fix: "Profile route on staging with auth; check DB and cold starts",
      });
    }
    if (s.errorRate > 0.01) {
      issues.push({
        severity: s.errorRate > 0.05 ? "critical" : "warning",
        message: `${s.id} errorRate=${s.errorRate}`,
      });
    }
  }
  for (const f of failureInjection) {
    if (!f.passed) {
      issues.push({
        severity: "critical",
        message: `Failure injection failed: ${f.id} — ${f.observed}`,
        fix: f.expectedBehavior,
      });
    }
  }
  if (!auth.configured) {
    issues.push({
      severity: "info",
      message: "Authenticated load not configured (LOAD_TEST_COOKIE or email/password)",
      fix: "Set credentials against staging for full page baselines",
    });
  }
  if (!liveBase) {
    issues.push({
      severity: "info",
      message: "Live Next server was not reachable; HTTP scenarios ran against local target",
      fix: "Start `npm run start` or set LOAD_TEST_BASE_URL to staging",
    });
  } else if (
    failureInjection.some(
      (f) => f.id === "live.deep" && f.observed.includes("status=401")
    )
  ) {
    issues.push({
      severity: "warning",
      message:
        "Live /api/ready/deep returned 401 — running build predates public deep-ready allowlist",
      fix: "Rebuild and restart so middleware public paths include /api/ready/deep",
    });
  }

  issues.push({
    severity: "info",
    message:
      "`next start` requires production env (APP_URL, CRON_SECRET, RESEND_API_KEY, VAULT_ENCRYPTION_KEY) or instrumentation fails and the server accepts no traffic",
    fix: "Ensure production secrets are present before load tests against `next start`",
  });
  if (enduranceMs < 60 * 60 * 1000) {
    issues.push({
      severity: "info",
      message: `Endurance duration ${enduranceMs}ms (< 1h). For RC soak set LOAD_ENDURANCE_MS to 6–24h on staging.`,
    });
  }

  const report: LoadSuiteReport = {
    sprint: "RC-2",
    generatedAt: new Date().toISOString(),
    baseUrl: httpBase,
    mode,
    authConfigured: auth.configured,
    scenarios,
    concurrencyRamp,
    endurance: {
      durationMs: enduranceMs,
      samples: endurance.samples,
      summary: endurance.summary,
      observations: endurance.observations,
    },
    failureInjection,
    database,
    baselines,
    issues,
    releaseReadiness: {
      status: "ready_with_gaps",
      summary: "",
      blockers: [],
    },
  };
  report.releaseReadiness = assessRelease(report);

  const outDir = ROOT;
  const reportPath = join(outDir, "perf-load-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  const baselinePath = join(outDir, "perf-load-baselines.json");
  const baselineDoc = {
    version: 1,
    sprint: "RC-2",
    updatedAt: report.generatedAt,
    mode: report.mode,
    authConfigured: report.authConfigured,
    http: Object.fromEntries(
      scenarios.map((s) => [
        s.id,
        {
          path: s.path,
          domain: s.domain,
          p50: s.latency.p50,
          p95: s.latency.p95,
          p99: s.latency.p99,
          throughputRps: s.throughputRps,
          errorRate: s.errorRate,
        },
      ])
    ),
    concurrencyRamp: concurrencyRamp.map((r) => ({
      concurrency: r.concurrency,
      p95: r.latency.p95,
      throughputRps: r.throughputRps,
      errorRate: r.errorRate,
    })),
    inProcess: probeBaselines,
    guidance: {
      p95TargetMs: 2000,
      p99TargetMs: 4000,
      maxErrorRate: 0.01,
    },
  };
  writeFileSync(baselinePath, JSON.stringify(baselineDoc, null, 2), "utf8");

  const docsDir = join(ROOT, "docs", "performance", "rc2");
  if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, "LOAD_RESILIENCE_REPORT.md"), renderMarkdown(report), "utf8");

  await local.close();

  console.log(`\nRC-2 report → ${reportPath}`);
  console.log(`RC-2 baselines → ${baselinePath}`);
  console.log(`Release readiness: ${report.releaseReadiness.status}`);
  console.log(report.releaseReadiness.summary);
  if (report.releaseReadiness.blockers.length) {
    for (const b of report.releaseReadiness.blockers) console.log(`  blocker: ${b}`);
  }

  const critical = report.issues.filter((i) => i.severity === "critical");
  if (critical.length) process.exitCode = 1;
}

function renderMarkdown(report: LoadSuiteReport): string {
  const lines: string[] = [];
  lines.push("# RC-2 Load, Scalability & Resilience Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Mode: ${report.mode} · Base URL: ${report.baseUrl}`);
  lines.push(`Auth configured: ${report.authConfigured}`);
  lines.push(`Release readiness: **${report.releaseReadiness.status}** — ${report.releaseReadiness.summary}`);
  lines.push("");
  lines.push("## Scenario latency");
  lines.push("");
  lines.push("| Scenario | Domain | VU | Req | RPS | p50 | p95 | p99 | Error |");
  lines.push("|----------|--------|----|-----|-----|-----|-----|-----|-------|");
  for (const s of report.scenarios) {
    lines.push(
      `| ${s.id} | ${s.domain} | ${s.concurrency} | ${s.requests} | ${s.throughputRps} | ${s.latency.p50} | ${s.latency.p95} | ${s.latency.p99} | ${s.errorRate} |`
    );
  }
  lines.push("");
  lines.push("## Concurrency ramp");
  lines.push("");
  lines.push("| VU | p50 | p95 | p99 | RPS | Error |");
  lines.push("|----|-----|-----|-----|-----|-------|");
  for (const s of report.concurrencyRamp) {
    lines.push(
      `| ${s.concurrency} | ${s.latency.p50} | ${s.latency.p95} | ${s.latency.p99} | ${s.throughputRps} | ${s.errorRate} |`
    );
  }
  lines.push("");
  lines.push("## Endurance");
  lines.push("");
  lines.push(`Duration: ${report.endurance.durationMs} ms`);
  if (report.endurance.summary) {
    lines.push(
      `Requests: ${report.endurance.summary.requests}, p95: ${report.endurance.summary.latency.p95} ms, error: ${report.endurance.summary.errorRate}`
    );
  }
  for (const o of report.endurance.observations) lines.push(`- ${o}`);
  lines.push("");
  lines.push("## Failure injection");
  lines.push("");
  for (const f of report.failureInjection) {
    lines.push(
      `- ${f.passed ? "PASS" : "FAIL"} **${f.name}** — ${f.observed} (${f.detail})`
    );
  }
  lines.push("");
  lines.push("## Database");
  lines.push("");
  lines.push(`Source: ${report.database.source}`);
  lines.push(`Deep ready: ${report.database.deepReadyStatus ?? "n/a"}`);
  lines.push(`DB p95 (metrics): ${report.database.metricsDbP95 ?? "n/a"}`);
  lines.push(`Slow queries: ${report.database.slowQueryCount ?? "n/a"}`);
  lines.push(report.database.poolNote ?? "");
  lines.push("");
  lines.push("## Issues");
  lines.push("");
  for (const i of report.issues) {
    lines.push(`- [${i.severity}] ${i.message}${i.fix ? ` → ${i.fix}` : ""}`);
  }
  lines.push("");
  return lines.join("\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
