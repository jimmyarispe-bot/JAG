/**
 * Sprint 060 cleanup: fix mangled at(-N) assertions and complete stale inline pipeline lists.
 */
import fs from "node:fs";
import path from "node:path";

const FULL_TAIL = [
  '"competitive"',
  '"political"',
  '"environmental"',
  '"stakeholder"',
  '"reputation"',
  '"behavioral"',
  '"cultural"',
  '"ethical"',
  '"systems"',
  '"resilience"',
  '"ecosystem"',
  '"institutional-memory"',
  '"collective"',
  '"wisdom"',
].join(", ");

const TERMINAL_ASSERTIONS = `    expect(result.moduleOrder.at(-3)).toBe("institutional-memory");
    expect(result.moduleOrder.at(-2)).toBe("collective");
    expect(result.moduleOrder.at(-1)).toBe("wisdom");`;

const dir = path.resolve("tests/unit/intelligence");
const files = [
  "behavioral.test.ts",
  "board-governance.test.ts",
  "competitive.test.ts",
  "document.test.ts",
  "economic.test.ts",
  "human-capital.test.ts",
  "impact.test.ts",
  "innovation.test.ts",
  "legal-compliance-risk.test.ts",
  "market.test.ts",
  "opportunity.test.ts",
  "organization-dna.test.ts",
  "political.test.ts",
  "predictive.test.ts",
  "revenue.test.ts",
  "stakeholder.test.ts",
];

for (const f of files) {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, "utf8");
  const before = c;

  // Complete stale arrays that end at economic without later domains
  c = c.replace(
    /"impact",\s*\n\s*"economic",\s*\n(\s*)\]/g,
    `"impact",\n      "economic", ${FULL_TAIL},\n$1]`,
  );
  c = c.replace(
    /"impact",\s*"economic"\]/g,
    `"impact", "economic", ${FULL_TAIL}]`,
  );

  // Also catch arrays ending at economic with trailing whitespace variants
  c = c.replace(
    /"economic",\s*\n(\s*)\](?!\s*;\s*\n\s*expect\(result\.moduleOrder)/g,
    (match, indent, offset, whole) => {
      // only if wisdom not already nearby before ]
      const slice = whole.slice(Math.max(0, offset - 200), offset + match.length);
      if (slice.includes('"wisdom"')) return match;
      if (!slice.includes('"economic"')) return match;
      return `"economic", ${FULL_TAIL},\n${indent}]`;
    },
  );

  // Replace brittle mid-pipeline at(-N) domain checks with terminal trio only
  // Keep PIPELINE_ORDER equality; drop conflicting relative domain checks.
  c = c.replace(
    /(\s*expect\(result\.moduleOrder\)\.toEqual\((?:PIPELINE_ORDER|\[[\s\S]*?\])\);\n)(?:\s*expect\(result\.moduleOrder\.at\(-[0-9]+\)\)\.toBe\("[a-z0-9-]+"\);\n)+(\s*expect\(result\.results)/g,
    `$1${TERMINAL_ASSERTIONS}\n$2`,
  );

  if (c !== before) {
    fs.writeFileSync(p, c);
    console.log("fixed", f);
  } else {
    console.log("unchanged", f);
  }
}
