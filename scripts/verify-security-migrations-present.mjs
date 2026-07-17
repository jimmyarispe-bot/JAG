#!/usr/bin/env node
/**
 * Wave 0 / H-A9 — verify security migrations 171 + 172 are present in-repo.
 * Does not require a live database. Exit 0 when both files exist.
 *
 * Run: node scripts/verify-security-migrations-present.mjs
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED = [
  "171_a1_architecture_security_rls.sql",
  "172_b1_security_remediation.sql",
];

const missing = REQUIRED.filter(
  (name) => !existsSync(join(ROOT, "supabase", "migrations", name))
);

if (missing.length) {
  console.error("H-A9 FAIL: missing security migrations:");
  for (const name of missing) console.error(`  - supabase/migrations/${name}`);
  process.exit(1);
}

console.log("H-A9 OK: security migrations present:");
for (const name of REQUIRED) {
  console.log(`  - supabase/migrations/${name}`);
}
console.log(
  "Remote apply still required per docs/architecture/phase-a/H-A9_OPS_GATE_EVIDENCE.md"
);
process.exit(0);
