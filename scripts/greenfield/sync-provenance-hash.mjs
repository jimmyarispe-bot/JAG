#!/usr/bin/env node
/**
 * Updates application-owned provenance artifact_hash to match rebuilt baseline
 * after a deterministic rebuild that does not require schema re-apply.
 * Greenfield target only. Never production.
 */
import { BASELINE_ID, PRODUCTION_DENY_REF } from "./constants.mjs";
import {
  MANIFEST_PATH,
  ROOT,
  assertNotProduction,
  linkedProjectRef,
  queryLinkedJson,
  readJson,
  runSupabase,
} from "./lib.mjs";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

function parseArgs(argv) {
  const out = { workdir: ROOT };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--workdir") out.workdir = argv[++i];
  }
  return out;
}

function main() {
  const { workdir: cwd } = parseArgs(process.argv);
  const ref = linkedProjectRef(cwd);
  assertNotProduction(ref);
  if (ref === PRODUCTION_DENY_REF) throw new Error("PRODUCTION DENY");
  const manifest = readJson(MANIFEST_PATH);
  const sql = `
    update public.platform_schema_baselines
    set
      artifact_hash = '${manifest.generated_artifact_hash}',
      source_commit = '${manifest.source_commit}',
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'hash_synced_at', now(),
        'sync_reason', 'deterministic_rebuild_lf_normalization'
      )
    where baseline_id = '${BASELINE_ID}'
    returning baseline_id, cutoff_migration, artifact_hash;
  `;
  const path = join(cwd, "supabase", ".temp", "sync-provenance.sql");
  writeFileSync(path, sql, "utf8");
  const result = runSupabase(["db", "query", "--linked", "-f", path], {
    cwd,
    allowFail: true,
  });
  if (!result.ok) {
    throw new Error(`${result.stderr}\n${result.stdout}`);
  }
  const row = queryLinkedJson(
    `select baseline_id, cutoff_migration, artifact_hash from public.platform_schema_baselines where baseline_id='${BASELINE_ID}'`,
    cwd
  )[0];
  if (row?.artifact_hash !== manifest.generated_artifact_hash) {
    throw new Error("Provenance sync failed");
  }
  console.log("PROVENANCE_HASH_SYNC=PASS");
  console.log(JSON.stringify(row));
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
