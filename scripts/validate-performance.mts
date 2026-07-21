import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildReleaseReport } from "../src/lib/platform/release";

const ROOT = process.cwd();
const required = [
  "scripts/perf-regression.mts",
  "scripts/bundle-budget.mts",
  "src/lib/observability",
  "docs/operations/rc11/03_PERFORMANCE.md",
];

console.log("AcademyOS Performance Gate\n");

let failed = false;
for (const rel of required) {
  const ok = existsSync(join(ROOT, rel));
  console.log(`  ${ok ? "✓" : "✗"} ${rel}`);
  if (!ok) failed = true;
}

const report = buildReleaseReport();
for (const m of report.modules) {
  const g = m.gates.find((x) => x.gate === "performance")!;
  console.log(`  ${m.definition.label}: ${g.verdict} (${g.score}) — ${g.summary}`);
  if (
    ["production-ready", "released", "tested"].includes(m.definition.status) &&
    g.verdict === "fail"
  ) {
    failed = true;
  }
}

if (failed) {
  console.error("\nPerformance gate FAILED.");
  process.exit(1);
}
console.log("\nPerformance gate passed.");
console.log("Also run: npm run perf:regression && npm run bundle:budget");
