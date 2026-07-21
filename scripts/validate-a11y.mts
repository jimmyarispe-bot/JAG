import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildReleaseReport } from "../src/lib/platform/release";

const ROOT = process.cwd();
const required = [
  "tests/a11y",
  "src/components/platform/crud",
  "docs/operations/rc11/01_ACCESSIBILITY.md",
];

console.log("AcademyOS Accessibility Gate (WCAG 2.2 AA)\n");

let failed = false;
for (const rel of required) {
  const ok = existsSync(join(ROOT, rel));
  console.log(`  ${ok ? "✓" : "✗"} ${rel}`);
  if (!ok) failed = true;
}

const report = buildReleaseReport();
for (const m of report.modules) {
  const g = m.gates.find((x) => x.gate === "accessibility")!;
  console.log(`  ${m.definition.label}: ${g.verdict} (${g.score}) — ${g.summary}`);
  if (
    ["production-ready", "released", "tested"].includes(m.definition.status) &&
    g.verdict === "fail"
  ) {
    failed = true;
    for (const issue of g.issues) console.error(`    · ${issue}`);
  }
}

if (failed) {
  console.error("\nAccessibility gate FAILED.");
  process.exit(1);
}
console.log("\nAccessibility gate passed.");
console.log("Run `npm run test:a11y` for axe-core WCAG evidence on critical routes.");
