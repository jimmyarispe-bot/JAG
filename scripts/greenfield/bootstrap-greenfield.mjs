#!/usr/bin/env node
/**
 * Apply GA_BASELINE_212 to an empty non-production Supabase project.
 *
 * Usage:
 *   node scripts/greenfield/bootstrap-greenfield.mjs --project-ref <ref> [--workdir <path>]
 *
 * Workdir must already be linked to the target project.
 * Does NOT write supabase_migrations rows for historical 001–212.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  BASELINE_ID,
  CUTOFF_MIGRATION,
  PRODUCTION_DENY_REF,
  PROHIBITED_AUTH_EMAIL,
  PROHIBITED_AUTH_UUID,
} from "./constants.mjs";
import {
  BASELINE_SQL_PATH,
  MANIFEST_PATH,
  ROOT,
  assertNotProduction,
  linkedProjectRef,
  queryLinkedJson,
  readJson,
  runSupabase,
  sha256,
} from "./lib.mjs";

function parseArgs(argv) {
  const out = { projectRef: null, workdir: ROOT };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project-ref") out.projectRef = argv[++i];
    else if (a === "--workdir") out.workdir = argv[++i];
  }
  return out;
}

function applySqlFile(filePath, cwd) {
  const result = runSupabase(["db", "query", "--linked", "-f", filePath], {
    cwd,
    allowFail: true,
  });
  if (!result.ok) {
    throw new Error(
      `Failed applying SQL file ${filePath}:\n${result.stderr}\n${result.stdout}`
    );
  }
  return result;
}

function applyInSourceChunks(artifact, cwd) {
  const re =
    /-- >>> BEGIN SOURCE ([^\n]+)\n([\s\S]*?)-- <<< END SOURCE \1\n/g;
  let match;
  let count = 0;
  const tmpDir = join(cwd, "supabase", ".temp", "greenfield-chunks");
  mkdirSync(tmpDir, { recursive: true });

  const firstBegin = artifact.indexOf("-- >>> BEGIN SOURCE");
  const preface = firstBegin >= 0 ? artifact.slice(0, firstBegin) : artifact;
  const prefacePath = join(tmpDir, "00_preface.sql");
  writeFileSync(prefacePath, preface, "utf8");
  applySqlFile(prefacePath, cwd);

  while ((match = re.exec(artifact)) !== null) {
    count += 1;
    const filename = match[1].trim();
    const body = match[2];
    const chunkPath = join(
      tmpDir,
      `${String(count).padStart(3, "0")}_${filename.replace(/[^\w.-]+/g, "_")}`
    );
    writeFileSync(chunkPath, body, "utf8");
    console.log(`Applying chunk ${count}: ${filename}`);
    applySqlFile(chunkPath, cwd);
  }
  if (count === 0) {
    throw new Error("No source chunks found in baseline artifact");
  }
  return count;
}

function main() {
  const args = parseArgs(process.argv);
  const cwd = args.workdir;
  const manifest = readJson(MANIFEST_PATH);
  const artifact = readFileSync(BASELINE_SQL_PATH, "utf8");
  const hash = sha256(artifact);
  if (hash !== manifest.generated_artifact_hash) {
    throw new Error("Baseline artifact hash mismatch — rebuild/verify first");
  }

  const ref = args.projectRef || linkedProjectRef(cwd);
  assertNotProduction(ref);
  if (ref === PRODUCTION_DENY_REF) {
    throw new Error("PRODUCTION DENY");
  }

  const linked = linkedProjectRef(cwd);
  if (linked !== ref) {
    throw new Error(
      `Workdir linked ref ${linked} != required ${ref}. Link the target project first.`
    );
  }

  console.log(`TARGET_REF=${ref}`);
  console.log("TARGET_IS_PRODUCTION=NO");
  console.log(`baseline_id=${BASELINE_ID}`);
  console.log(`artifact_hash=${hash}`);

  const tables = queryLinkedJson(
    `select table_name from information_schema.tables
     where table_schema='public'
       and table_name in ('organization_branding','platform_applications','platform_schema_baselines','students')`,
    cwd
  ).filter((t) => t && t.table_name);
  if (tables.length > 0) {
    throw new Error(
      `Target not eligible/empty. public tables present: ${tables
        .map((t) => t.table_name)
        .join(", ")}`
    );
  }

  let ledger158 = [];
  try {
    ledger158 = queryLinkedJson(
      `select version from supabase_migrations.schema_migrations
       where cast(version as text) like '158%'
       limit 5`,
      cwd
    );
  } catch {
    ledger158 = [];
  }
  if (ledger158.length > 0) {
    throw new Error("Target historical ledger already references 158 — refuse");
  }

  console.log("Applying greenfield baseline…");
  try {
    applySqlFile(BASELINE_SQL_PATH, cwd);
  } catch (err) {
    console.warn(String(err.message || err));
    console.warn("Falling back to chunked source application…");
    applyInSourceChunks(artifact, cwd);
  }

  const metadata = {
    excluded_historical_repairs: (manifest.excluded_historical_repairs || []).map(
      (e) => e.filename
    ),
    included_count: (manifest.included_migrations || []).length,
  };
  const provSql = `
    insert into public.platform_schema_baselines (
      baseline_id,
      cutoff_migration,
      artifact_hash,
      source_commit,
      baseline_format_version,
      generation_method,
      metadata
    ) values (
      '${BASELINE_ID}',
      ${CUTOFF_MIGRATION},
      '${hash}',
      '${manifest.source_commit}',
      ${manifest.baseline_format_version},
      '${manifest.generation_method}',
      $json$${JSON.stringify(metadata)}$json$::jsonb
    )
    on conflict (baseline_id) do update set
      artifact_hash = excluded.artifact_hash,
      applied_at = now();
  `;
  const provPath = join(cwd, "supabase", ".temp", "greenfield-provenance.sql");
  writeFileSync(provPath, provSql, "utf8");
  applySqlFile(provPath, cwd);

  const prov = queryLinkedJson(
    `select baseline_id, cutoff_migration, artifact_hash from public.platform_schema_baselines
     where baseline_id = '${BASELINE_ID}'`,
    cwd
  );
  if (!prov.length || Number(prov[0].cutoff_migration) !== CUTOFF_MIGRATION) {
    throw new Error("Baseline provenance postcondition failed");
  }

  const checks = {
    organization_branding: `select to_regclass('public.organization_branding') is not null as ok`,
    JAG_PLATFORM_ADMIN: `select exists(select 1 from public.platform_permissions where permission_key='JAG_PLATFORM_ADMIN') as ok`,
    JAG_ORG_ACCESS: `select exists(select 1 from public.platform_permissions where permission_key='JAG_ORG_ACCESS') as ok`,
    PLATFORM_OWNER: `select exists(select 1 from public.roles where name='PLATFORM_OWNER') as ok`,
    JAG_ORG_ADMIN: `select exists(select 1 from public.roles where name='JAG_ORG_ADMIN') as ok`,
    is_platform_steward: `select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='is_platform_steward') as ok`,
    user_can_access_organization: `select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='user_can_access_organization') as ok`,
    is_enterprise_admin: `select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='is_enterprise_admin') as ok`,
    is_enterprise_admin_for_organization: `select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='is_enterprise_admin_for_organization') as ok`,
    users_select_access: `select exists(select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='users_select_access') as ok`,
    historical_auth: `select exists(select 1 from auth.users where id = '${PROHIBITED_AUTH_UUID}'::uuid or lower(email)=lower('${PROHIBITED_AUTH_EMAIL}')) as present`,
    seed_founder: `select exists(select 1 from public.users where lower(email)='jimmy@theacademyway.org') as ok`,
  };

  const results = {};
  for (const [name, sql] of Object.entries(checks)) {
    results[name] = queryLinkedJson(sql, cwd)[0];
  }
  try {
    results.ledger_158 = queryLinkedJson(
      `select exists(select 1 from supabase_migrations.schema_migrations where cast(version as text) like '158%') as present`,
      cwd
    )[0];
  } catch {
    results.ledger_158 = { present: false };
  }

  for (const key of [
    "organization_branding",
    "JAG_PLATFORM_ADMIN",
    "JAG_ORG_ACCESS",
    "PLATFORM_OWNER",
    "JAG_ORG_ADMIN",
    "is_platform_steward",
    "user_can_access_organization",
    "is_enterprise_admin",
    "is_enterprise_admin_for_organization",
    "users_select_access",
    "seed_founder",
  ]) {
    if (!results[key]?.ok) {
      throw new Error(`Postcondition failed: ${key}`);
    }
  }
  if (results.historical_auth?.present) {
    throw new Error("Historical founder Auth identity present — fail closed");
  }
  if (results.ledger_158?.present) {
    throw new Error("Historical ledger fabrication detected for 158");
  }

  console.log("GREENFIELD_BOOTSTRAP=PASS");
  console.log("HISTORICAL_LEDGER_FABRICATION=NO");
  console.log(JSON.stringify({ provenance: prov[0], checks: results }, null, 2));
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
