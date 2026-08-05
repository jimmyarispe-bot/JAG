#!/usr/bin/env node
/**
 * Static canonical inventory check derived from baseline composition sources.
 * Complements live DB postconditions after bootstrap.
 */
import { readFileSync } from "node:fs";
import { BASELINE_SQL_PATH, MANIFEST_PATH, readJson } from "./lib.mjs";

const REQUIRED_SOURCE_MARKERS = [
  "063_funding_junction_api.sql",
  "064_funding_junction_rpc_fix.sql",
  "174_auto_provision_auth_users.sql",
  "175_complete_auth_user_provisioning.sql",
  "200_sprint059_application_registry.sql",
  "211_organization_branding.sql",
  "212_jag_org_scoped_authorization.sql",
];

const REQUIRED_SQL_FRAGMENTS = [
  "create table if not exists public.organization_branding",
  "JAG_PLATFORM_ADMIN",
  "JAG_ORG_ACCESS",
  "PLATFORM_OWNER",
  "JAG_ORG_ADMIN",
  "is_platform_steward",
  "user_can_access_organization",
  "is_enterprise_admin_for_organization",
  "users_select_access",
  "platform_applications",
  "platform_schema_baselines",
];

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const sql = readFileSync(BASELINE_SQL_PATH, "utf8");
  const included = new Set(
    (manifest.included_migrations || []).map((m) => m.filename)
  );

  for (const marker of REQUIRED_SOURCE_MARKERS) {
    if (!included.has(marker)) {
      throw new Error(`Canonical inventory missing included source ${marker}`);
    }
    if (!sql.includes(`BEGIN SOURCE ${marker}`)) {
      throw new Error(`Baseline artifact missing source marker ${marker}`);
    }
  }
  if (included.has("158_sprint002_authenticated_founder_repair.sql")) {
    throw new Error("Canonical inventory incorrectly includes 158");
  }
  for (const frag of REQUIRED_SQL_FRAGMENTS) {
    if (!sql.includes(frag)) {
      throw new Error(`Canonical inventory missing fragment: ${frag}`);
    }
  }
  console.log("GREENFIELD_CANONICAL_EQUIVALENCE=PASS");
  console.log(`included_sources=${included.size}`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
