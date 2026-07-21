/**
 * AcademyOS Module Completion Standard (v2) — aggregate release gate.
 */
import {
  MODULE_COMPLETION_RULE_V2,
  buildReleaseReport,
  GATE_LABELS,
} from "../src/lib/platform/release";

console.log(MODULE_COMPLETION_RULE_V2);
console.log("");

const report = buildReleaseReport();

for (const m of report.modules) {
  const icon =
    m.overallVerdict === "pass" ? "PASS" : m.overallVerdict === "warn" ? "WARN" : "FAIL";
  console.log(
    `[${icon}] ${m.definition.label.padEnd(22)} declared=${m.definition.status.padEnd(18)} effective=${m.effectiveStatus.padEnd(18)} score=${m.overallScore}`
  );
  for (const g of m.gates) {
    if (g.verdict === "na") continue;
    const mark =
      g.verdict === "pass" ? "✓" : g.verdict === "warn" || g.verdict === "pending" ? "~" : "✗";
    console.log(`       ${mark} ${GATE_LABELS[g.gate]}: ${g.summary}`);
  }
  console.log("");
}

if (!report.ok) {
  console.error("Release gate FAILED — blocking issues:\n");
  for (const issue of report.blockingIssues) {
    console.error(`  [${issue.moduleId}/${issue.gate}] ${issue.message}`);
  }
  console.error("\nSee docs/platform/module-completion-standard.md");
  process.exit(1);
}

console.log(`Release gate passed (${report.modules.length} modules).`);
console.log(`Generated at ${report.generatedAt}`);
