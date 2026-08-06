#!/usr/bin/env node
/**
 * Conclusive post-bootstrap verification.
 * Classifies BASELINE_APPLY_CONFIRMED or BASELINE_APPLY_FAILED.
 *
 * Absence of supabase_migrations.schema_migrations is NOT a failure.
 *
 * Usage: node scripts/greenfield/verify-greenfield-live.mjs --workdir <path>
 */
import {
  BASELINE_ID,
  CUTOFF_MIGRATION,
  PRODUCTION_DENY_REF,
  PROHIBITED_AUTH_EMAIL,
  PROHIBITED_AUTH_UUID,
} from "./constants.mjs";
import {
  ROOT,
  assertNotProduction,
  linkedProjectRef,
  queryLinkedJson,
  readJson,
  MANIFEST_PATH,
} from "./lib.mjs";
import { BASELINE_COMPLETENESS_FINGERPRINTS } from "./transforms.mjs";

function parseArgs(argv) {
  const out = { workdir: ROOT };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--workdir") out.workdir = argv[++i];
  }
  return out;
}

function fail(reason, details = {}) {
  console.error("BASELINE_APPLY_FAILED");
  console.error(reason);
  if (Object.keys(details).length) {
    console.error(JSON.stringify(details, null, 2));
  }
  process.exit(1);
}

function main() {
  const { workdir: cwd } = parseArgs(process.argv);
  const ref = linkedProjectRef(cwd);
  assertNotProduction(ref);
  if (ref === PRODUCTION_DENY_REF) fail("PRODUCTION DENY");

  const manifest = readJson(MANIFEST_PATH);
  console.log(`TARGET_REF=${ref}`);
  console.log("TARGET_IS_PRODUCTION=NO");

  // Connectivity
  let connectivity = "FAIL";
  try {
    const ping = queryLinkedJson("select 1::int as ok", cwd);
    if (Number(ping?.[0]?.ok) === 1) connectivity = "PASS";
  } catch (err) {
    fail("Database connectivity failed", { error: String(err.message || err) });
  }
  console.log(`DATABASE_CONNECTIVITY=${connectivity}`);

  // Provenance table + row
  let provTable = false;
  try {
    const t = queryLinkedJson(
      `select to_regclass('public.platform_schema_baselines') is not null as ok`,
      cwd
    );
    provTable = Boolean(t?.[0]?.ok);
  } catch {
    provTable = false;
  }
  console.log(`PROVENANCE_TABLE_EXISTS=${provTable ? "YES" : "NO"}`);
  if (!provTable) fail("platform_schema_baselines missing — partial or failed apply");

  const prov = queryLinkedJson(
    `select baseline_id, cutoff_migration, artifact_hash, source_commit
     from public.platform_schema_baselines
     where baseline_id = '${BASELINE_ID}'`,
    cwd
  );
  if (!prov.length) fail("Missing GA_BASELINE_212 provenance row");
  if (Number(prov[0].cutoff_migration) !== CUTOFF_MIGRATION) {
    fail("Provenance cutoff mismatch", { row: prov[0] });
  }
  if (prov[0].artifact_hash !== manifest.generated_artifact_hash) {
    fail("Provenance artifact hash mismatch vs manifest", {
      expected: manifest.generated_artifact_hash,
      actual: prov[0].artifact_hash,
    });
  }
  console.log("PROVENANCE_ROW=PASS");

  // Completeness fingerprints — reject PARTIAL
  const fingerprints = {};
  for (const fp of BASELINE_COMPLETENESS_FINGERPRINTS) {
    const row = queryLinkedJson(fp.sql, cwd)[0];
    fingerprints[fp.id] = Boolean(row?.ok);
    if (!row?.ok) {
      fail(`Completeness fingerprint failed: ${fp.id} — PARTIAL BASELINE`, {
        fingerprints,
      });
    }
  }
  console.log("COMPLETENESS_FINGERPRINTS=PASS");

  // Historical Auth absence
  const historicalAuth = queryLinkedJson(
    `select exists(
       select 1 from auth.users
       where id = '${PROHIBITED_AUTH_UUID}'::uuid
          or lower(email)=lower('${PROHIBITED_AUTH_EMAIL}')
     ) as present`,
    cwd
  )[0];
  if (historicalAuth?.present) {
    fail("Historical founder Auth identity present");
  }
  console.log("HISTORICAL_AUTH_ABSENT=YES");

  // schema_migrations: absence OK; presence of 158 is fabrication
  let ledgerState = "ABSENT_OR_UNREADABLE";
  let ledger158 = false;
  try {
    const exists = queryLinkedJson(
      `select to_regclass('supabase_migrations.schema_migrations') is not null as ok`,
      cwd
    )[0];
    if (exists?.ok) {
      ledgerState = "PRESENT";
      ledger158 = Boolean(
        queryLinkedJson(
          `select exists(select 1 from supabase_migrations.schema_migrations where cast(version as text) like '158%') as present`,
          cwd
        )[0]?.present
      );
    } else {
      ledgerState = "ABSENT";
    }
  } catch {
    ledgerState = "ABSENT_OR_UNREADABLE";
  }
  if (ledger158) fail("Historical ledger fabrication detected for 158");
  console.log(`SCHEMA_MIGRATIONS_LEDGER=${ledgerState}`);
  console.log("HISTORICAL_LEDGER_FABRICATION=NO");

  console.log("BASELINE_APPLY_CONFIRMED");
  console.log(
    JSON.stringify(
      {
        connectivity,
        provenance: prov[0],
        fingerprints,
        ledgerState,
        historical_auth_present: false,
        atomicity_note:
          "Apply is multi-statement (not one DB transaction); acceptance requires full fingerprint + provenance match.",
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}
