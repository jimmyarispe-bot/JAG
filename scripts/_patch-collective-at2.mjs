import fs from "node:fs";
import path from "node:path";

// Only files that still assert at(-2) === ecosystem after pipeline grew past institutional-memory.
const files = [
  "behavioral.test.ts",
  "competitive.test.ts",
  "cultural.test.ts",
  "document.test.ts",
  "economic.test.ts",
  "environmental.test.ts",
  "ethical.test.ts",
  "impact.test.ts",
  "innovation.test.ts",
  "legal-compliance-risk.test.ts",
  "market.test.ts",
  "political.test.ts",
  "reputation.test.ts",
  "resilience.test.ts",
  "stakeholder.test.ts",
  "systems.test.ts",
];

const dir = "tests/unit/intelligence";
for (const f of files) {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, "utf8");
  const next = c.replace(
    'expect(result.moduleOrder.at(-2)).toBe("ecosystem");',
    'expect(result.moduleOrder.at(-2)).toBe("institutional-memory");'
  );
  if (next === c) {
    console.log("no change", f);
  } else {
    fs.writeFileSync(p, next);
    console.log("updated", f);
  }
}
console.log("done");
