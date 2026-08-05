#!/usr/bin/env node
/**
 * Fail-closed verification of the generated greenfield baseline artifact.
 *
 * Usage: node scripts/greenfield/verify-greenfield-baseline.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import {
  BASELINE_ID,
  CUTOFF_MIGRATION,
  PROHIBITED_AUTH_EMAIL,
  PROHIBITED_AUTH_UUID,
  REQUIRED_IMMUTABLE_158_BLOB,
} from "./constants.mjs";
import {
  BASELINE_SQL_PATH,
  MANIFEST_PATH,
  assertImmutable158,
  readJson,
  sha256,
} from "./lib.mjs";

function main() {
  const blob158 = assertImmutable158();
  if (!existsSync(BASELINE_SQL_PATH) || !existsSync(MANIFEST_PATH)) {
    throw new Error("Baseline artifact/manifest missing — run db:baseline:build");
  }

  const manifest = readJson(MANIFEST_PATH);
  const sql = readFileSync(BASELINE_SQL_PATH, "utf8");
  const hash = sha256(sql);

  if (manifest.baseline_id !== BASELINE_ID) {
    throw new Error(`manifest baseline_id mismatch: ${manifest.baseline_id}`);
  }
  if (manifest.cutoff !== CUTOFF_MIGRATION) {
    throw new Error(`manifest cutoff mismatch: ${manifest.cutoff}`);
  }
  if (manifest.generated_artifact_hash !== hash) {
    throw new Error("Artifact hash does not match manifest — rebuild required");
  }
  if (manifest.historical_repair_158_blob !== REQUIRED_IMMUTABLE_158_BLOB) {
    throw new Error("Manifest 158 blob does not match required immutable blob");
  }
  if (blob158 !== REQUIRED_IMMUTABLE_158_BLOB) {
    throw new Error("Live 158 blob drift detected");
  }

  const excluded158 = (manifest.excluded_historical_repairs || []).some((e) =>
    String(e.filename).startsWith("158_")
  );
  if (!excluded158) {
    throw new Error("Manifest does not exclude migration 158");
  }
  if ((manifest.included_migrations || []).some((m) => String(m.filename).startsWith("158_"))) {
    throw new Error("Manifest incorrectly includes migration 158");
  }

  const executableBody = sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
  if (executableBody.includes(PROHIBITED_AUTH_UUID)) {
    throw new Error("Executable baseline contains prohibited Auth UUID");
  }
  if (executableBody.toLowerCase().includes(PROHIBITED_AUTH_EMAIL.toLowerCase())) {
    throw new Error("Executable baseline contains prohibited Auth email");
  }
  if (!sql.includes("platform_schema_baselines")) {
    throw new Error("Baseline missing platform_schema_baselines provenance table");
  }
  if (!sql.includes("212_jag_org_scoped_authorization.sql")) {
    throw new Error("Baseline composition missing cutoff source 212");
  }

  console.log("GREENFIELD_BASELINE_VERIFY=PASS");
  console.log(`baseline_id=${manifest.baseline_id}`);
  console.log(`cutoff=${manifest.cutoff}`);
  console.log(`artifact_hash=${hash}`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
