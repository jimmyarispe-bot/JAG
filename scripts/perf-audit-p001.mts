/**
 * Sprint P001 — run platform performance audit (measure + report only).
 * Usage: npx tsx scripts/perf-audit-p001.mts
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { runP001PerformanceAudit } from "../src/lib/performance/p001-audit";

async function main() {
  const report = await runP001PerformanceAudit();
  const outPath = join(process.cwd(), "perf-p001-audit-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`P001 audit written → ${outPath}`);
  console.log(`Top 25 bottlenecks (by ROI):\n`);
  for (const b of report.top25) {
    console.log(
      `${String(b.rank).padStart(2)}. [${b.estimatedImpact}/${b.effort}] ${b.target}`
    );
    console.log(`    time: ${b.timeMs ?? "n/a"} — ${b.timeNote.slice(0, 100)}`);
    console.log(`    fix: ${b.recommendedFix.slice(0, 100)}`);
  }
  console.log(`\nEstimated gains: ${report.estimatedPerformanceGains.ifTop5Fixed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
