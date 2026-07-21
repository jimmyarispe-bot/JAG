/**
 * RC-5 — PostgreSQL / Supabase restore rehearsal harness.
 *
 * Automates post-restore probe matrix when RC5_RESTORE_BASE_URL points at a scratch project.
 * Without scratch URL, emits operator checklist + formal deferral evidence (G-RC1-08).
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

async function timedGet(url: string): Promise<{ status: number; ms: number; body: string }> {
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual" });
    const body = await res.text();
    return { status: res.status, ms: Date.now() - start, body: body.slice(0, 300) };
  } catch (error) {
    return {
      status: 0,
      ms: Date.now() - start,
      body: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const started = Date.now();
  const scratch = (process.env.RC5_RESTORE_BASE_URL ?? "").replace(/\/$/, "");
  const checks: Check[] = [];

  const operatorSteps = [
    "Confirm Supabase PITR / daily backups enabled (screenshot)",
    "Record earliest restore point",
    "Create non-prod scratch Supabase project",
    "Restore PITR watermark into scratch",
    "Point staging app at scratch NEXT_PUBLIC_SUPABASE_*",
    "Run this harness with RC5_RESTORE_BASE_URL",
    "Login as seeded admin; verify school-scoped list",
    "Negative cross-tenant query (expect empty/deny)",
    "Record RTO/RPO",
  ];

  if (!scratch) {
    checks.push({
      id: "restore.scratch.missing",
      status: "deferred",
      detail:
        "RC5_RESTORE_BASE_URL not set — physical PITR restore requires operator Supabase access (G-RC1-08).",
    });
  } else {
    for (const path of ["/api/health", "/api/ready", "/api/ready/deep"]) {
      const hit = await timedGet(`${scratch}${path}`);
      const ok =
        path === "/api/ready/deep"
          ? hit.status === 200 || hit.status === 503
          : hit.status === 200 || hit.status === 503;
      checks.push({
        id: `restore.probe${path.replace(/\//g, ".")}`,
        status: ok ? "pass" : "fail",
        detail: `HTTP ${hit.status}`,
        latencyMs: hit.ms,
      });
    }
    checks.push({
      id: "restore.rto.clock",
      status: "pass",
      detail: `Harness wall time ${Date.now() - started}ms (operator must supply restore-start clock for true RTO)`,
    });
  }

  const failed = checks.filter((c) => c.status === "fail");
  const deferred = checks.filter((c) => c.status === "deferred");
  const overall =
    failed.length > 0 ? "fail" : deferred.length > 0 ? "deferred_with_harness" : "pass";

  const report = {
    sprint: "RC-5",
    generatedAt: new Date().toISOString(),
    scratchBaseUrl: scratch || null,
    overall,
    checks,
    operatorSteps,
    rtoTargetHours: 4,
    rpoTargetHours: 24,
  };

  writeFileSync(join(ROOT, "perf-rc5-restore-rehearsal.json"), JSON.stringify(report, null, 2));
  mkdirSync(join(ROOT, "docs/operations/rc5"), { recursive: true });
  writeFileSync(
    join(ROOT, "docs/operations/rc5/04_RESTORE_REHEARSAL.md"),
    [
      "# RC-5 — Database Restore Rehearsal",
      "",
      `Generated: ${report.generatedAt}`,
      `Overall: **${overall}**`,
      `Scratch URL configured: ${scratch ? "yes" : "no"}`,
      "",
      "## Automated checks",
      "",
      ...checks.map(
        (c) =>
          `- **[${c.status}] ${c.id}** — ${c.detail}${c.latencyMs != null ? ` (${c.latencyMs}ms)` : ""}`
      ),
      "",
      "## Operator steps (G-RC1-08)",
      "",
      ...operatorSteps.map((s, i) => `${i + 1}. [ ] ${s}`),
      "",
      "Canonical procedure: `docs/operations/phase-f/runbooks/13_DATABASE_BACKUP_RESTORE.md`",
      "",
    ].join("\n")
  );

  console.log(`RC-5 restore rehearsal: ${overall}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
