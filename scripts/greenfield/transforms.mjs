/**
 * Explicit, fail-closed composition transforms for greenfield baseline building.
 * Historical migration files are never modified on disk.
 */
import {
  PROHIBITED_AUTH_EMAIL,
  PROHIBITED_AUTH_UUID,
} from "./constants.mjs";

/** Exact historical founder bootstrap array fragment from migration 175. */
export const TRANSFORM_175_FOUNDER_ARRAY = {
  id: "strip_historical_founder_bootstrap_email",
  filename: "175_complete_auth_user_provisioning.sql",
  classification: "HISTORICAL_RUNTIME_FOUNDER_BOOTSTRAP_CONFIG",
  expectedOccurrences: 1,
  from: `array[
    'jimmy@theacademyway.org',
    'jimmy.arispe@theacademyway.org'
  ]::text[]`,
  to: `array[
    'jimmy@theacademyway.org'
  ]::text[]`,
  reason:
    "Removes historical production Auth email from founder_bootstrap_emails only; seed jimmy@ and schema/catalog unchanged.",
};

export function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while (true) {
    const found = haystack.indexOf(needle, idx);
    if (found === -1) return count;
    count += 1;
    idx = found + needle.length;
  }
}

/**
 * Apply declared transforms for a source migration. Fail-closed.
 * Source is newline-normalized so Windows CRLF checkouts match pinned LF patterns.
 */
export function composeSourceSql(filename, sql) {
  const transforms = [];
  // Always normalize newlines so baseline artifact hashes are OS-stable.
  let out = normalizeNewlines(sql);

  if (filename === TRANSFORM_175_FOUNDER_ARRAY.filename) {
    const t = TRANSFORM_175_FOUNDER_ARRAY;
    const from = normalizeNewlines(t.from);
    const to = normalizeNewlines(t.to);
    const occurrences = countOccurrences(out, from);
    if (occurrences !== t.expectedOccurrences) {
      throw new Error(
        `${filename}: transform ${t.id} expected ${t.expectedOccurrences} occurrence(s) of pinned pattern, found ${occurrences}`
      );
    }
    out = out.replace(from, to);
    if (countOccurrences(out, from) !== 0) {
      throw new Error(`${filename}: transform ${t.id} did not fully apply`);
    }
    if (countOccurrences(out, to) !== 1) {
      throw new Error(
        `${filename}: transform ${t.id} expected result pattern once, found ${countOccurrences(out, to)}`
      );
    }
    if (out.toLowerCase().includes(PROHIBITED_AUTH_EMAIL.toLowerCase())) {
      throw new Error(
        `${filename}: prohibited Auth email remains after ${t.id}`
      );
    }
    if (out.includes(PROHIBITED_AUTH_UUID)) {
      throw new Error(`${filename}: prohibited Auth UUID present`);
    }
    transforms.push({
      id: t.id,
      classification: t.classification,
      reason: t.reason,
      occurrences_applied: t.expectedOccurrences,
    });
  } else if (out.toLowerCase().includes(PROHIBITED_AUTH_EMAIL.toLowerCase())) {
    throw new Error(
      `${filename}: contains prohibited Auth email but no declared transform`
    );
  } else if (out.includes(PROHIBITED_AUTH_UUID)) {
    throw new Error(
      `${filename}: contains prohibited Auth UUID but no declared transform`
    );
  }

  return { sql: out, transforms };
}

export function executableLines(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

/** Required structural fingerprints for COMPLETE baseline acceptance. */
export const BASELINE_COMPLETENESS_FINGERPRINTS = [
  { id: "organization_branding", sql: `select to_regclass('public.organization_branding') is not null as ok` },
  { id: "platform_schema_baselines", sql: `select to_regclass('public.platform_schema_baselines') is not null as ok` },
  { id: "platform_forward_migrations", sql: `select to_regclass('public.platform_forward_migrations') is not null as ok` },
  { id: "JAG_PLATFORM_ADMIN", sql: `select exists(select 1 from public.platform_permissions where permission_key='JAG_PLATFORM_ADMIN') as ok` },
  { id: "JAG_ORG_ACCESS", sql: `select exists(select 1 from public.platform_permissions where permission_key='JAG_ORG_ACCESS') as ok` },
  { id: "PLATFORM_OWNER", sql: `select exists(select 1 from public.roles where name='PLATFORM_OWNER') as ok` },
  { id: "JAG_ORG_ADMIN", sql: `select exists(select 1 from public.roles where name='JAG_ORG_ADMIN') as ok` },
  { id: "is_platform_steward", sql: `select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='is_platform_steward') as ok` },
  { id: "user_can_access_organization", sql: `select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='user_can_access_organization') as ok` },
  { id: "is_enterprise_admin", sql: `select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='is_enterprise_admin') as ok` },
  { id: "is_enterprise_admin_for_organization", sql: `select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='is_enterprise_admin_for_organization') as ok` },
  { id: "users_select_access", sql: `select exists(select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='users_select_access') as ok` },
  { id: "seed_founder", sql: `select exists(select 1 from public.users where lower(email)='jimmy@theacademyway.org') as ok` },
  { id: "app_registry", sql: `select exists(select 1 from public.platform_applications) as ok` },
  { id: "auth_provisioning_config", sql: `select exists(select 1 from public.auth_provisioning_config where id=1) as ok` },
  {
    id: "founder_bootstrap_emails_seed_only",
    sql: `select (
      exists(select 1 from public.auth_provisioning_config c where c.id=1 and 'jimmy@theacademyway.org' = any(c.founder_bootstrap_emails))
      and not exists(select 1 from public.auth_provisioning_config c where c.id=1 and 'jimmy.arispe@theacademyway.org' = any(c.founder_bootstrap_emails))
    ) as ok`,
  },
];
