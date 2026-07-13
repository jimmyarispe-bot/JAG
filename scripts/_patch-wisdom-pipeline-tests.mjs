/**
 * Sprint 060: append "wisdom" to PIPELINE_ORDER endings and update terminal assertions.
 * Does not modify collective/ or other intelligence package sources.
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("tests/unit/intelligence");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.ts"));

for (const f of files) {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, "utf8");
  const before = c;

  c = c.replace(
    /"institutional-memory", "collective"\]/g,
    '"institutional-memory", "collective", "wisdom"]',
  );
  c = c.replace(
    /"institutional-memory", "collective",\s*\n(\s*)\]/g,
    '"institutional-memory", "collective", "wisdom",\n$1]',
  );

  if (f !== "wisdom.test.ts") {
    c = c.replace(
      /moduleOrder\.at\(-1\)\)\.toBe\("collective"\)/g,
      'moduleOrder.at(-1)).toBe("wisdom")',
    );
  }

  if (f === "collective.test.ts") {
    c = c.replace(
      /moduleOrder\.at\(-2\)\)\.toBe\("institutional-memory"\)/g,
      'moduleOrder.at(-2)).toBe("collective")',
    );
    c = c.replace(
      /runs as the terminal platform module after institutional-memory/g,
      "runs as the penultimate platform module before wisdom",
    );
  }

  if (f === "oios-core.test.ts" && !c.includes('registry.get("wisdom")')) {
    c = c.replace(
      'expect(stack.registry.get("collective")?.status).toBe("active");',
      'expect(stack.registry.get("collective")?.status).toBe("active");\n    expect(stack.registry.get("wisdom")?.status).toBe("active");',
    );
  }

  if (c !== before) {
    fs.writeFileSync(p, c);
    console.log("fixed", f);
  } else {
    console.log("ok", f);
  }
}
