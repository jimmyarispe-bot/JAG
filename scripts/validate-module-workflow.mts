/**
 * Product Workflow Gate — lifecycle events must be reachable by Workflow Engine.
 * Chained from `npm run validate:workflow` alongside the platform B-04 registry check.
 */
import { buildReleaseReport } from "../src/lib/platform/release";

const report = buildReleaseReport();
let failed = false;

console.log("AcademyOS Workflow Gate (lifecycle → Workflow Engine)\n");
for (const m of report.modules) {
  const g = m.gates.find((x) => x.gate === "workflow")!;
  console.log(`  ${m.definition.label}: ${g.verdict} (${g.score}) — ${g.summary}`);
  if (
    ["production-ready", "released", "workflow-complete", "ei-complete", "tested"].includes(
      m.definition.status
    ) &&
    g.verdict === "fail"
  ) {
    failed = true;
    for (const issue of g.issues) console.error(`    · ${issue}`);
  }
}

if (failed) {
  console.error("\nWorkflow gate FAILED.");
  process.exit(1);
}
console.log("\nWorkflow gate passed.");
