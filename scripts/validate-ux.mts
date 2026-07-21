import { buildReleaseReport } from "../src/lib/platform/release";

const report = buildReleaseReport();
let failed = false;

console.log("AcademyOS UX Consistency Gate\n");
for (const m of report.modules) {
  const g = m.gates.find((x) => x.gate === "ux")!;
  console.log(`  ${m.definition.label}: ${g.verdict} (${g.score}) — ${g.summary}`);
  if (
    ["production-ready", "released"].includes(m.definition.status) &&
    g.verdict === "fail"
  ) {
    failed = true;
    for (const issue of g.issues) console.error(`    · ${issue}`);
  }
}

if (failed) {
  console.error("\nUX gate FAILED.");
  process.exit(1);
}
console.log("\nUX gate passed.");
