/**
 * RC-10 — Production GA suite aggregator + Go/No-Go.
 * Readiness only — no product features.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildGaSignOff } from "@/lib/platform/production";

const ROOT = process.cwd();

async function main() {
  const generatedAt = new Date().toISOString();

  const productionTests = spawnSync(
    "npx",
    ["vitest", "run", "tests/unit/platform/production/production-ga.test.ts"],
    { cwd: ROOT, env: process.env, encoding: "utf8", shell: true }
  );

  const signOff = await buildGaSignOff({
    root: ROOT,
    now: () => new Date(generatedAt),
    runImportSmoke: true,
  });

  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const requiredScripts = [
    "perf:regression",
    "load:suite",
    "security:audit-deps",
    "security:authz-inventory",
    "security:recovery",
    "acceptance:rc4",
    "rc5:suite",
    "test:e2e",
    "test:unit",
    "test:a11y",
    "rc10:suite",
  ];
  const missingScripts = requiredScripts.filter((s) => !pkg.scripts?.[s]);

  let decision = signOff.decision;
  let summary = signOff.summary;
  if (productionTests.status !== 0 || missingScripts.length > 0) {
    decision = "no_go";
    summary = `No-Go — production tests exit=${productionTests.status ?? 1}; missing scripts: ${missingScripts.join(", ") || "none"}`;
  }

  const report = {
    version: signOff.version,
    generatedAt,
    decision,
    summary,
    productionTests: {
      ok: productionTests.status === 0,
      detail: `exit=${productionTests.status ?? 1}`,
    },
    missingScripts,
    signOff,
    governance: signOff.governance,
  };

  mkdirSync(join(ROOT, "docs/operations/rc10/artifacts"), { recursive: true });
  const outPath = join(ROOT, "perf-rc10-go-no-go.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  writeFileSync(
    join(ROOT, "docs/operations/rc10/artifacts/ga-sign-off.json"),
    JSON.stringify(signOff, null, 2)
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
