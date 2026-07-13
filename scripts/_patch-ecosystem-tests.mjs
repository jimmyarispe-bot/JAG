/**
 * Append "ecosystem" to full PIPELINE_ORDER assertions after "resilience".
 * Sprint 057 test updates only - does not touch resilience package source.
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("tests/unit/intelligence");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.ts"));

for (const file of files) {
  if (file === "ecosystem.test.ts") continue;
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, "utf8");
  const orig = c;

  c = c.replaceAll(
    '"ethical", "systems", "resilience",',
    '"ethical", "systems", "resilience", "ecosystem",'
  );
  c = c.replaceAll(
    '"ethical", "systems", "resilience"]',
    '"ethical", "systems", "resilience", "ecosystem"]'
  );

  c = c.replaceAll(
    'expect(result.moduleOrder.at(-2)).toBe("systems");\n    expect(result.moduleOrder.at(-1)).toBe("resilience");',
    'expect(result.moduleOrder.at(-2)).toBe("resilience");\n    expect(result.moduleOrder.at(-1)).toBe("ecosystem");'
  );

  if (file === "resilience.test.ts") {
    c = c.replace(
      'it("runs as the terminal platform module after systems", async () => {',
      'it("runs as the platform module before ecosystem", async () => {'
    );
  }

  if (file === "systems.test.ts") {
    c = c.replace(
      'it("runs as the platform module before resilience", async () => {',
      'it("runs ahead of resilience and ecosystem in the pipeline", async () => {'
    );
  }

  if (file === "oios-core.test.ts") {
    c = c.replace(
      'expect(stack.registry.get("resilience")?.status).toBe("active");\n    expect(stack.registry.get("organization-dna")?.status).toBe("active");',
      'expect(stack.registry.get("resilience")?.status).toBe("active");\n    expect(stack.registry.get("ecosystem")?.status).toBe("active");\n    expect(stack.registry.get("organization-dna")?.status).toBe("active");'
    );
  }

  if (c !== orig) {
    fs.writeFileSync(p, c);
    console.log("updated", file);
  }
}

console.log("done");
