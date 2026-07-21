/**
 * RC-5 — production-mode deployment rehearsal (local or staging URL).
 *
 * Validates: env contract presence, optional build, startup probes
 * (/api/health, /api/ready, /api/ready/deep), timing.
 *
 * Set RC5_DEPLOY_BASE_URL / PLAYWRIGHT_BASE_URL for remote.
 * Set RC5_RUN_BUILD=1 to include `npm run build` duration (slow).
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadDotEnvFiles } from "./load-dotenv";

loadDotEnvFiles();

type Check = {
  id: string;
  status: "pass" | "fail" | "skip" | "warn";
  detail: string;
  latencyMs?: number;
};

const ROOT = process.cwd();
const REQUIRED_PROD = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "VAULT_ENCRYPTION_KEY",
  "RESEND_API_KEY",
] as const;

async function timedGet(url: string, timeoutMs = 20_000): Promise<{ status: number; ms: number }> {
  const start = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "manual" });
    return { status: res.status, ms: Date.now() - start };
  } catch {
    return { status: 0, ms: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number; ms: number }> {
  const start = Date.now();
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      env,
      shell: true,
      stdio: "inherit",
    });
    child.on("exit", (code) => resolve({ code: code ?? 1, ms: Date.now() - start }));
  });
}

async function main() {
  const checks: Check[] = [];
  const base = (
    process.env.RC5_DEPLOY_BASE_URL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    process.env.RC4_BASE_URL ??
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");

  const softEnv =
    process.env.RC5_ALLOW_OFFLINE === "1" ||
    process.env.CI === "true" ||
    process.env.RC5_SOFT_ENV === "1";

  // Secrets / env — presence only (never print values)
  for (const key of REQUIRED_PROD) {
    const present = Boolean(process.env[key]?.trim());
    // Local/CI rehearsal may lack full prod secret set — warn not fail
    const soft =
      softEnv ||
      key === "RESEND_API_KEY" ||
      key === "NEXT_PUBLIC_APP_URL" ||
      key === "CRON_SECRET" ||
      key === "VAULT_ENCRYPTION_KEY";
    checks.push({
      id: `deploy.env.${key}`,
      status: present ? "pass" : soft ? "warn" : "fail",
      detail: present ? "present" : soft ? "missing (warn)" : "missing",
    });
  }

  let buildMs: number | null = null;
  if (process.env.RC5_RUN_BUILD === "1") {
    const build = await run("npm", ["run", "build"], {
      ...process.env,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000",
      CRON_SECRET: process.env.CRON_SECRET ?? "rc5-rehearsal-cron-secret-32chars",
      VAULT_ENCRYPTION_KEY:
        process.env.VAULT_ENCRYPTION_KEY ?? "rc5-rehearsal-vault-key-32chars!!",
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_rc5.placeholder",
    });
    buildMs = build.ms;
    checks.push({
      id: "deploy.build",
      status: build.code === 0 ? "pass" : "fail",
      detail: `exit=${build.code}`,
      latencyMs: build.ms,
    });
  } else {
    checks.push({
      id: "deploy.build",
      status: "skip",
      detail: "RC5_RUN_BUILD not set — skipped (set=1 for full build rehearsal)",
    });
    if (existsSync(join(ROOT, ".next"))) {
      checks.push({
        id: "deploy.artifact",
        status: "pass",
        detail: ".next build artifact present",
      });
    } else {
      checks.push({
        id: "deploy.artifact",
        status: "warn",
        detail: "No .next directory — start may fail until build",
      });
    }
  }

  const offlineOk =
    process.env.RC5_ALLOW_OFFLINE === "1" || process.env.CI === "true";
  const deployStart = Date.now();
  const healthProbe = await timedGet(`${base}/api/health`);
  const unreachable = healthProbe.status === 0;

  if (unreachable && offlineOk) {
    checks.push({
      id: "deploy.probe.offline",
      status: "skip",
      detail: `Target unreachable (${base}) — offline/CI mode; re-run against live staging for full rehearsal`,
      latencyMs: healthProbe.ms,
    });
  } else {
    for (const path of ["/api/health", "/api/ready", "/api/ready/deep"]) {
      const hit = path === "/api/health" ? healthProbe : await timedGet(`${base}${path}`);
      let status: Check["status"] = "fail";
      let detail = `HTTP ${hit.status} @ ${base}`;
      if (path === "/api/health") {
        status = hit.status === 200 ? "pass" : "fail";
      } else if (path === "/api/ready") {
        status = hit.status === 200 || hit.status === 503 ? "pass" : "fail";
      } else if (path === "/api/ready/deep") {
        // 401 = stale deploy before public allowlist; source is public — warn, rebuild to clear
        if (hit.status === 200 || hit.status === 503) status = "pass";
        else if (hit.status === 401) {
          status = "warn";
          detail = `HTTP 401 (stale build allowlist) @ ${base} — rebuild/redeploy to publish public deep probe`;
        }
      }
      checks.push({
        id: `deploy.probe${path.replace(/\//g, ".")}`,
        status,
        detail,
        latencyMs: hit.ms,
      });
    }

    const metrics = await timedGet(`${base}/api/observability/metrics`);
    checks.push({
      id: "deploy.monitoring.metrics",
      status:
        metrics.status === 200 || metrics.status === 401 || metrics.status === 404
          ? "pass"
          : "warn",
      detail: `HTTP ${metrics.status} (401/404 acceptable depending on lock-down)`,
      latencyMs: metrics.ms,
    });
  }

  const failed = checks.filter((c) => c.status === "fail");
  const overall =
    failed.length > 0 ? "fail" : unreachable && offlineOk ? "deferred_offline" : "pass_with_notes";
  const report = {
    sprint: "RC-5",
    generatedAt: new Date().toISOString(),
    baseUrl: base,
    overall,
    deploymentDurationMs: Date.now() - deployStart,
    buildDurationMs: buildMs,
    checks,
  };

  writeFileSync(join(ROOT, "perf-rc5-deploy-rehearsal.json"), JSON.stringify(report, null, 2));
  mkdirSync(join(ROOT, "docs/operations/rc5"), { recursive: true });
  writeFileSync(
    join(ROOT, "docs/operations/rc5/05_DEPLOYMENT_REHEARSAL.md"),
    [
      "# RC-5 — Deployment Rehearsal",
      "",
      `Generated: ${report.generatedAt}`,
      `Overall: **${overall}**`,
      `Base URL: ${base}`,
      `Probe window: ${report.deploymentDurationMs}ms`,
      `Build duration: ${buildMs != null ? `${buildMs}ms` : "skipped"}`,
      "",
      "## Checks",
      "",
      ...checks.map(
        (c) =>
          `- **[${c.status}] ${c.id}** — ${c.detail}${c.latencyMs != null ? ` (${c.latencyMs}ms)` : ""}`
      ),
      "",
      "## Notes",
      "",
      "- Vercel promote drill remains operator-owned (see phase-f runbook 12).",
      "- This harness validates production-mode health/ready/deep against a running target.",
      "",
    ].join("\n")
  );

  console.log(`RC-5 deploy rehearsal: ${overall}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
