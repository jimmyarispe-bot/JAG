/**
 * RC-11 — Production Readiness suite aggregator + Go/No-Go.
 * Reliability / ops only — no product features.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildReleaseReport } from "../../src/lib/platform/release";
import {
  ensureProductionIntegrationsRegistered,
  listPriorityIntegrationHealth,
  listRealtimeTopics,
} from "../../src/lib/production";

const ROOT = process.cwd();

function run(script: string): { ok: boolean; detail: string } {
  const result = spawnSync("npm", ["run", script], {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    shell: true,
  });
  return {
    ok: result.status === 0,
    detail: `exit=${result.status ?? 1}`,
  };
}

async function main() {
  const generatedAt = new Date().toISOString();

  const gates = {
    a11y: run("validate:a11y"),
    mobile: run("validate:mobile"),
    performance: run("validate:performance"),
    security: run("validate:security"),
    production: run("validate:production"),
    release: run("validate:release"),
  };

  const unit = spawnSync(
    "npx",
    ["vitest", "run", "tests/unit/production"],
    { cwd: ROOT, env: process.env, encoding: "utf8", shell: true }
  );

  ensureProductionIntegrationsRegistered();
  const integrations = listPriorityIntegrationHealth();
  const realtimeTopics = listRealtimeTopics();
  const release = buildReleaseReport();

  const opsDocs = [
    "docs/operations/rc11/07_DEPLOYMENT_RUNBOOK.md",
    "docs/operations/rc11/08_ROLLBACK.md",
    "docs/operations/rc11/09_MONITORING_PLAYBOOK.md",
    "docs/operations/rc11/10_INCIDENT_RESPONSE.md",
    "docs/operations/rc11/11_PRODUCTION_CHECKLIST.md",
    "docs/operations/rc11/12_DISASTER_RECOVERY.md",
  ];
  const missingOps = opsDocs.filter((p) => !existsSync(join(ROOT, p)));

  const gateFails = Object.entries(gates)
    .filter(([, v]) => !v.ok)
    .map(([k]) => k);
  const integrationRegistered = integrations.every((i) => i.registered);

  let decision: "go" | "conditional_go" | "no_go" = "go";
  let summary = "Go — RC11 production readiness gates clear";

  if (
    gateFails.length > 0 ||
    unit.status !== 0 ||
    missingOps.length > 0 ||
    !integrationRegistered ||
    realtimeTopics.length < 5
  ) {
    decision = "no_go";
    summary = `No-Go — gates=${gateFails.join(",") || "ok"}; unit=${unit.status ?? 1}; missingOps=${missingOps.length}; integrations=${integrationRegistered}`;
  } else if (!release.ok) {
    decision = "conditional_go";
    summary =
      "Conditional Go — validation gates pass; release aggregate has soft warnings";
  }

  const report = {
    version: "rc11",
    generatedAt,
    decision,
    summary,
    gates,
    unitTests: { ok: unit.status === 0, detail: `exit=${unit.status ?? 1}` },
    integrations,
    realtimeTopics,
    missingOps,
    releaseOk: release.ok,
    blockingIssues: release.blockingIssues.slice(0, 20),
  };

  mkdirSync(join(ROOT, "docs/operations/rc11/artifacts"), { recursive: true });
  const outPath = join(ROOT, "perf-rc11-go-no-go.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  writeFileSync(
    join(ROOT, "docs/operations/rc11/artifacts/go-no-go.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(
    JSON.stringify(
      { decision: report.decision, summary: report.summary, outPath },
      null,
      2
    )
  );

  if (decision === "no_go") process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
