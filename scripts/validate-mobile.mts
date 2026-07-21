import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildReleaseReport } from "../src/lib/platform/release";

const ROOT = process.cwd();
const playwrightPath = join(ROOT, "playwright.config.ts");
const playwright = existsSync(playwrightPath)
  ? readFileSync(playwrightPath, "utf8")
  : "";
const hasMobileProject =
  playwright.includes('name: "mobile"') ||
  playwright.includes("Pixel 5") ||
  playwright.includes("iPhone");

console.log("AcademyOS Mobile Responsiveness Gate\n");

let failed = false;
const checks: Array<[string, boolean]> = [
  ["src/components/platform/crud", existsSync(join(ROOT, "src/components/platform/crud"))],
  ["docs/operations/rc11/02_MOBILE.md", existsSync(join(ROOT, "docs/operations/rc11/02_MOBILE.md"))],
  ["Playwright mobile project", hasMobileProject],
];

for (const [label, ok] of checks) {
  console.log(`  ${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed = true;
}

const report = buildReleaseReport();
for (const m of report.modules) {
  const g = m.gates.find((x) => x.gate === "mobile")!;
  console.log(`  ${m.definition.label}: ${g.verdict} (${g.score}) — ${g.summary}`);
  if (
    ["production-ready", "released", "tested"].includes(m.definition.status) &&
    g.verdict === "fail"
  ) {
    failed = true;
  }
}

if (failed) {
  console.error("\nMobile gate FAILED.");
  process.exit(1);
}
console.log("\nMobile gate passed.");
console.log("Run `npm run test:mobile` for device-emulation smoke.");
