import fs from "node:fs";
import path from "node:path";

const dir = "tests/unit/intelligence";
const files = fs.readdirSync(dir).filter((x) => x.endsWith(".test.ts"));

for (const f of files) {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, "utf8");
  const before = c;

  // Exact common PIPELINE_ORDER ending (and funding inline order)
  c = c.replaceAll(
    'ecosystem", "institutional-memory"',
    'ecosystem", "institutional-memory", "collective"'
  );

  // Fix at(-1) assertions that expect institutional-memory as terminal
  if (f !== "collective.test.ts") {
    c = c.replaceAll(
      'expect(result.moduleOrder.at(-1)).toBe("institutional-memory");',
      'expect(result.moduleOrder.at(-1)).toBe("collective");'
    );
  }

  if (c !== before) {
    fs.writeFileSync(p, c);
    console.log("updated", f);
  }
}

// Special-case institutional-memory.test.ts at(-2)/at(-1)
{
  const p = path.join(dir, "institutional-memory.test.ts");
  let c = fs.readFileSync(p, "utf8");
  c = c.replace(
    `expect(result.moduleOrder.at(-2)).toBe("ecosystem");
    expect(result.moduleOrder.at(-1)).toBe("collective");`,
    `expect(result.moduleOrder.at(-2)).toBe("institutional-memory");
    expect(result.moduleOrder.at(-1)).toBe("collective");`
  );
  c = c.replace(
    "runs as the terminal platform module after ecosystem",
    "runs as the platform module before collective"
  );
  fs.writeFileSync(p, c);
  console.log("fixed institutional-memory assertions");
}

// oios-core: expect collective active
{
  const p = path.join(dir, "oios-core.test.ts");
  let c = fs.readFileSync(p, "utf8");
  if (!c.includes('registry.get("collective")')) {
    c = c.replace(
      'expect(stack.registry.get("institutional-memory")?.status).toBe("active");',
      `expect(stack.registry.get("institutional-memory")?.status).toBe("active");
    expect(stack.registry.get("collective")?.status).toBe("active");`
    );
    fs.writeFileSync(p, c);
    console.log("updated oios-core active check");
  }
}

console.log("done");
