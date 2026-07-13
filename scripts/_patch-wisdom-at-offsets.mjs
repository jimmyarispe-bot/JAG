/**
 * Sprint 060: shift relative moduleOrder.at(-N) assertions after appending wisdom.
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("tests/unit/intelligence");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.ts"));

for (const f of files) {
  if (f === "wisdom.test.ts" || f === "collective.test.ts") continue;
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, "utf8");
  const before = c;

  // Common pattern: at(-2) was institutional-memory when collective was terminal
  c = c.replace(
    /moduleOrder\.at\(-2\)\)\.toBe\("institutional-memory"\)/g,
    'moduleOrder.at(-2)).toBe("collective")',
  );

  // Domains that checked themselves at(-3) when institutional-memory was at(-2)
  // now need at(-4) for themselves and at(-3) for institutional-memory
  c = c.replace(
    /moduleOrder\.at\(-3\)\)\.toBe\("ecosystem"\)/g,
    'moduleOrder.at(-4)).toBe("ecosystem")',
  );
  c = c.replace(
    /moduleOrder\.at\(-3\)\)\.toBe\("stakeholder"\)/g,
    'moduleOrder.at(-4)).toBe("stakeholder")',
  );
  c = c.replace(
    /moduleOrder\.at\(-3\)\)\.toBe\("political"\)/g,
    'moduleOrder.at(-4)).toBe("political")',
  );

  // After changing at(-2) to collective, insert at(-3)=institutional-memory where missing
  // for files that previously had at(-2)=institutional-memory
  if (
    before.includes('at(-2)).toBe("institutional-memory")') &&
    !c.includes('at(-3)).toBe("institutional-memory")')
  ) {
    c = c.replace(
      'expect(result.moduleOrder.at(-2)).toBe("collective");',
      'expect(result.moduleOrder.at(-3)).toBe("institutional-memory");\n    expect(result.moduleOrder.at(-2)).toBe("collective");',
    );
  }

  // For ecosystem/stakeholder/political that already had at(-3) for themselves,
  // ensure at(-3)=institutional-memory exists after we moved self to at(-4)
  if (
    (f === "ecosystem.test.ts" ||
      f === "stakeholder.test.ts" ||
      f === "political.test.ts") &&
    !c.includes('at(-3)).toBe("institutional-memory")')
  ) {
    c = c.replace(
      'expect(result.moduleOrder.at(-2)).toBe("collective");',
      'expect(result.moduleOrder.at(-3)).toBe("institutional-memory");\n    expect(result.moduleOrder.at(-2)).toBe("collective");',
    );
  }

  if (f === "infrastructure.test.ts") {
    c = c.replace(
      /health\.modules\.length\)\.toBe\(38\)/g,
      "health.modules.length).toBe(39)",
    );
  }

  if (f === "institutional-memory.test.ts") {
    // Ensure: at(-3)=institutional-memory, at(-2)=collective, at(-1)=wisdom
    // The generic replace already handled at(-2)->collective and may have inserted at(-3)
  }

  if (c !== before) {
    fs.writeFileSync(p, c);
    console.log("fixed", f);
  } else {
    console.log("ok", f);
  }
}
