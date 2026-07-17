/**
 * Part 2: domain-correct Ethical Intelligence sources after cultural->ethical transform.
 * Run: node scripts/generate-ethical-intelligence.mjs && node scripts/generate-ethical-part2.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/ethical");
const root = process.cwd();

const scripts = [
  "scripts/generate-ethical-part2-areas.mjs",
  "scripts/_finalize-ethical.mjs",
  "scripts/_patch-ethical-types.mjs",
  "scripts/_write-types.mjs",
  "scripts/_write-engines.mjs",
  "scripts/_write-composers.mjs",
  "scripts/_write-engine-index.mjs",
  "scripts/_write-std-engines.mjs",
  "scripts/_write-docs.mjs",
];

// Areas script is required; live file ships with the repo (no .bak fallback).
const areasPath = path.join(root, "scripts/generate-ethical-part2-areas.mjs");
if (!fs.existsSync(areasPath)) {
  console.error("missing required script:", areasPath);
  process.exit(1);
}

for (const rel of scripts) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.warn("skip missing", rel);
    continue;
  }
  const r = spawnSync(process.execPath, [full], { stdio: "inherit", cwd: root });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("Part 2 complete. File count:", fs.readdirSync(DEST).length);