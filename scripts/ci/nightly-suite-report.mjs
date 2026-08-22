#!/usr/bin/env node
/**
 * Nightly suite report — run the unit suite and diff it against a committed
 * baseline of known failures.
 *
 * Reports; never gates. Exit code is informational only:
 *   0  no new failures
 *   1  new failures relative to the baseline
 *   2  the run itself collapsed (could not judge)
 *
 * The baseline is the CONTAINER baseline - a clean clone on Linux with no
 * .env.local. It deliberately differs from tests/known-failures.json, which is
 * recorded on a developer machine. This one is what CI and any fresh clone see.
 *
 *   node scripts/ci/nightly-suite-report.mjs
 *   node scripts/ci/nightly-suite-report.mjs --update-baseline
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASELINE = "tests/known-failures.container.json";
const MIN_TESTS = 2000; // a run reporting fewer than this did not really run
const updating = process.argv.includes("--update-baseline");

const out = join(mkdtempSync(join(tmpdir(), "suite-")), "results.json");

let ran = true;
try {
  execFileSync(
    "npx",
    ["vitest", "run", "tests/unit", "--reporter=json", `--outputFile=${out}`, "--no-color"],
    { stdio: "ignore", timeout: 45 * 60 * 1000 }
  );
} catch {
  ran = false; // non-zero exit is expected when tests fail; the JSON is what matters
}

if (!existsSync(out)) {
  console.log("## Suite report\n\n**The run produced no JSON report.** Could not judge.");
  process.exit(2);
}

const report = JSON.parse(readFileSync(out, "utf8"));
const total = report.numTotalTests ?? 0;
const passed = report.numPassedTests ?? 0;

const current = [];
for (const file of report.testResults ?? []) {
  const rel = file.name.replace(`${process.cwd()}/`, "").replace(/\\/g, "/");
  for (const a of file.assertionResults ?? []) {
    if (a.status === "failed") current.push(`${rel} :: ${a.fullName}`);
  }
}
current.sort();

if (total < MIN_TESTS) {
  console.log(
    `## Suite report\n\n**Only ${total} tests ran** (expected at least ${MIN_TESTS}).\n` +
      "The run collapsed rather than passing - treat this as a broken run, not a clean one."
  );
  process.exit(2);
}

if (updating) {
  writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`Baseline written: ${BASELINE} (${current.length} known failures)`);
  process.exit(0);
}

let baseline = [];
let haveBaseline = false;
if (existsSync(BASELINE)) {
  baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
  haveBaseline = true;
}

const baseSet = new Set(baseline);
const curSet = new Set(current);
const appeared = current.filter((t) => !baseSet.has(t));
const fixed = baseline.filter((t) => !curSet.has(t));

const lines = [];
lines.push("## Suite report");
lines.push("");
lines.push(`- **${passed} passed / ${total} total**, ${current.length} failing`);
if (haveBaseline) {
  lines.push(`- Baseline: ${baseline.length} known failures`);
  lines.push(`- **New: ${appeared.length}** · Fixed: ${fixed.length}`);
} else {
  lines.push(`- No ${BASELINE} found - reporting absolute state only.`);
}
lines.push("");

if (appeared.length) {
  lines.push("### New failures — not in the baseline");
  lines.push("");
  for (const t of appeared) lines.push(`- \`${t}\``);
  lines.push("");
}
if (fixed.length) {
  lines.push("### Newly passing — baseline is stale");
  lines.push("");
  for (const t of fixed) lines.push(`- \`${t}\``);
  lines.push("");
  lines.push("Prune with `node scripts/ci/nightly-suite-report.mjs --update-baseline`.");
  lines.push("");
}
if (!appeared.length && !fixed.length && haveBaseline) {
  lines.push("No change since the baseline.");
  lines.push("");
}

console.log(lines.join("\n"));
process.exit(appeared.length ? 1 : 0);
