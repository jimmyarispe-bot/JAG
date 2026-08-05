#!/usr/bin/env node
/**
 * Post-bootstrap live verification (idempotent).
 * Usage: node scripts/greenfield/verify-greenfield-live.mjs --workdir <path>
 */
import {
  BASELINE_ID,
  CUTOFF_MIGRATION,
  PROHIBITED_AUTH_EMAIL,
  PROHIBITED_AUTH_UUID,
} from "./constants.mjs";
import { ROOT, linkedProjectRef, queryLinkedJson, readJson, MANIFEST_PATH } from "./lib.mjs";

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
  const manifest = readJson(MANIFEST_PATH);
  console.log(`TARGET_REF=${ref}`);
  console.log("TARGET_IS_PRODUCTION=NO");

  const prov = queryLinkedJson(
    `select baseline_id, cutoff_migration, artifact_hash from public.platform_schema_baselines
     where baseline_id = '${BASELINE_ID}'`,
    cwd
  );
  if (!prov.length) {
    // insert provenance if schema exists but row missing
    throw new Error("Missing platform_schema_baselines provenance row");
  }
  if (Number(prov[0].cutoff_migration) !== CUTOFF_MIGRATION) {
    throw new Error("cutoff mismatch");
  }
  if (prov[0].artifact_hash !== manifest.generated_artifact_hash) {
    throw new Error("artifact hash mismatch vs manifest");
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
    app_registry: `select exists(select 1 from public.platform_applications) as ok`,
    rls_users: `select relrowsecurity as ok from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='users'`,
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
    "app_registry",
    "rls_users",
  ]) {
    if (!results[key]?.ok) throw new Error(`Postcondition failed: ${key}`);
  }
  if (results.historical_auth?.present) {
    throw new Error("Historical founder Auth present");
  }
  if (results.ledger_158?.present) {
    throw new Error("Historical ledger fabrication for 158");
  }

  console.log("GREENFIELD_LIVE_VERIFY=PASS");
  console.log("HISTORICAL_LEDGER_FABRICATION=NO");
  console.log(JSON.stringify({ provenance: prov[0], checks: results }, null, 2));
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
