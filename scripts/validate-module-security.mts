import { buildReleaseReport } from "../src/lib/platform/release";

const report = buildReleaseReport();
const fails = report.modules.flatMap((m) => {
  const g = m.gates.find((x) => x.gate === "security");
  if (!g || g.verdict !== "fail") return [];
  if (!["production-ready", "released"].includes(m.definition.status)) return [];
  return g.issues.map((message) => ({ module: m.definition.id, message }));
});

console.log("AcademyOS Security Gate (Module Completion Standard v2)\n");
for (const m of report.modules) {
  const g = m.gates.find((x) => x.gate === "security")!;
  console.log(`  ${m.definition.label}: ${g.verdict} (${g.score}) — ${g.summary}`);
}

if (fails.length) {
  console.error("\nSecurity gate FAILED for production-ready modules:");
  for (const f of fails) console.error(`  [${f.module}] ${f.message}`);
  process.exit(1);
}
console.log("\nSecurity gate passed.");
