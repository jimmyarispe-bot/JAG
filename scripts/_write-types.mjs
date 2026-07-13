import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/ethical");

// Use the known-good content assembled for Sprint 054
const content = fs.readFileSync(path.resolve("scripts/ethical-templates/types-body.ts"), "utf8");
fs.writeFileSync(path.join(DEST, "types.ts"), content, "utf8");
console.log("types from template", content.length);