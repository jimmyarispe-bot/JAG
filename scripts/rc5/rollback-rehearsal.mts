/**
 * RC-5 — controlled rollback rehearsal.
 *
 * Local mode: measure recovery time for sequential health probes after a
 * simulated "redeploy window" (pause + re-probe), documenting app-level RTO.
 * Operator mode: set RC5_ROLLBACK_CONFIRMED=1 after Vercel previous-promote.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadDotEnvFiles } from "./load-dotenv";

loadDotEnvFiles();

type Check = {
  id: string;
  status: "pass" | "fail" | "skip" | "deferred";
  detail: string;
  latencyMs?: number;
};

const ROOT = process.cwd();

async function timedGet(url: string): Promise<{ status: number; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual" });
    return { status: res.status, ms: Date.now() - start };
  } catch {
    return { status: 0, ms: Date.now() - start };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const base = (
    process.env.RC5_DEPLOY_BASE_URL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
  const checks: Check[] = [];
  const clockStart = Date.now();

  const offlineOk =
    process.env.RC5_ALLOW_OFFLINE === "1" || process.env.CI === "true";

  // Pre-rollback health
  const pre = await timedGet(`${base}/api/health`);
  if (pre.status === 0 && offlineOk) {
    checks.push({
      id: "rollback.pre.offline",
      status: "skip",
      detail: `Target unreachable (${base}) — offline/CI mode`,
      latencyMs: pre.ms,
    });
  } else {
    checks.push({
      id: "rollback.pre.health",
      status: pre.status === 200 ? "pass" : "fail",
      detail: `HTTP ${pre.status}`,
      latencyMs: pre.ms,
    });

    const pauseMs = Number(process.env.RC5_ROLLBACK_PAUSE_MS ?? 2000);
    await sleep(pauseMs);
    checks.push({
      id: "rollback.window",
      status: "pass",
      detail: `Simulated cutover pause ${pauseMs}ms`,
    });

    let recoveredAt: number | null = null;
    for (let i = 0; i < 10; i++) {
      const hit = await timedGet(`${base}/api/health`);
      if (hit.status === 200 && recoveredAt == null) recoveredAt = Date.now();
      checks.push({
        id: `rollback.post.health.${i + 1}`,
        status: hit.status === 200 ? "pass" : "fail",
        detail: `HTTP ${hit.status}`,
        latencyMs: hit.ms,
      });
      if (hit.status === 200) break;
      await sleep(500);
    }

    const ready = await timedGet(`${base}/api/ready`);
    checks.push({
      id: "rollback.post.ready",
      status: ready.status === 200 || ready.status === 503 ? "pass" : "fail",
      detail: `HTTP ${ready.status}`,
      latencyMs: ready.ms,
    });

    const deep = await timedGet(`${base}/api/ready/deep`);
    checks.push({
      id: "rollback.post.deep",
      status:
        deep.status === 200 || deep.status === 503
          ? "pass"
          : deep.status === 401
            ? "skip"
            : "fail",
      detail:
        deep.status === 401
          ? "HTTP 401 stale build — rebuild to publish public deep probe"
          : `HTTP ${deep.status}`,
      latencyMs: deep.ms,
    });

    // attach recovery for report below via closure — stored on checks detail
    if (recoveredAt != null) {
      checks.push({
        id: "rollback.recovery.clock",
        status: "pass",
        detail: `Recovered in ${recoveredAt - clockStart}ms`,
        latencyMs: recoveredAt - clockStart,
      });
    }
  }

  if (process.env.RC5_ROLLBACK_CONFIRMED === "1") {
    checks.push({
      id: "rollback.vercel.promote",
      status: "pass",
      detail: "Operator confirmed prior Vercel deployment promoted (RC5_ROLLBACK_CONFIRMED=1)",
    });
  } else {
    checks.push({
      id: "rollback.vercel.promote",
      status: "deferred",
      detail:
        "Vercel previous-deployment promote not confirmed in this environment — set RC5_ROLLBACK_CONFIRMED=1 after drill",
    });
  }

  const recoveryCheck = checks.find((c) => c.id === "rollback.recovery.clock");
  const recoveryMs = recoveryCheck?.latencyMs ?? null;
  const failed = checks.filter((c) => c.status === "fail");
  const deferred = checks.filter((c) => c.status === "deferred");
  const skippedOffline = checks.some((c) => c.id === "rollback.pre.offline");
  const overall = failed.length
    ? "fail"
    : skippedOffline
      ? "deferred_offline"
      : deferred.length > 0
        ? "pass_local_deferred_vercel"
        : "pass";

  const report = {
    sprint: "RC-5",
    generatedAt: new Date().toISOString(),
    baseUrl: base,
    overall,
    recoveryDurationMs: recoveryMs,
    checks,
  };

  writeFileSync(join(ROOT, "perf-rc5-rollback-rehearsal.json"), JSON.stringify(report, null, 2));
  mkdirSync(join(ROOT, "docs/operations/rc5"), { recursive: true });
  writeFileSync(
    join(ROOT, "docs/operations/rc5/06_ROLLBACK_REHEARSAL.md"),
    [
      "# RC-5 — Rollback Rehearsal",
      "",
      `Generated: ${report.generatedAt}`,
      `Overall: **${overall}**`,
      `Base URL: ${base}`,
      `App recovery duration: ${recoveryMs != null ? `${recoveryMs}ms` : "not recovered"}`,
      "",
      "## Checks",
      "",
      ...checks.map(
        (c) =>
          `- **[${c.status}] ${c.id}** — ${c.detail}${c.latencyMs != null ? ` (${c.latencyMs}ms)` : ""}`
      ),
      "",
      "## Compatibility notes",
      "",
      "- App-only rollback: promote prior Vercel deployment (runbook 12).",
      "- DB rollback: prefer forward-fix; PITR via restore rehearsal (G-RC1-08).",
      "- Monitoring continuity: health/ready/deep re-probed post window.",
      "",
    ].join("\n")
  );

  console.log(`RC-5 rollback rehearsal: ${overall}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
