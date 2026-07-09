/**
 * READ-ONLY: inspect Jimmy's auth/public user linkage, roles, permissions, migration 155.
 * Usage: npx tsx scripts/inspect-jimmy-rbac-readonly.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnvVar(name: string): string {
  if (process.env[name]) return process.env[name]!;
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return "";
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== name) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return "";
}

const EMAIL = (loadLocalEnvVar("STABILIZATION_EMAIL") || "jimmy@academyos.org").toLowerCase();
const SUPABASE_URL = loadLocalEnvVar("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = loadLocalEnvVar("SUPABASE_SERVICE_ROLE_KEY");

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("=== READ-ONLY Jimmy RBAC Inspection ===");
  console.log("email:", EMAIL);

  const { data: authList, error: authListError } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (authListError) {
    console.error("auth.admin.listUsers failed:", authListError.message);
    process.exit(1);
  }

  const authUser = authList.users.find((u) => u.email?.toLowerCase() === EMAIL) ?? null;
  console.log("\n--- 1. auth.users ---");
  if (!authUser) {
    console.log("NOT FOUND: no auth.users row for", EMAIL);
  } else {
    console.log({
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      email_confirmed_at: authUser.email_confirmed_at,
    });
  }

  const { data: publicUsers, error: publicUsersError } = await admin
    .from("users")
    .select("id, email, full_name, created_at")
    .ilike("email", EMAIL);

  console.log("\n--- 2. public.users ---");
  if (publicUsersError) {
    console.error("public.users query failed:", publicUsersError.message);
  } else if (!publicUsers?.length) {
    console.log("NOT FOUND: no public.users row for", EMAIL);
  } else {
    for (const row of publicUsers) {
      console.log(row);
    }
  }

  const publicUser = publicUsers?.[0] ?? null;
  console.log("\n--- 3. auth ↔ public linkage ---");
  if (!authUser || !publicUser) {
    console.log("linkage: BROKEN or INCOMPLETE (missing auth and/or public row)");
  } else if (authUser.id === publicUser.id) {
    console.log("linkage: OK — auth.users.id === public.users.id", authUser.id);
  } else {
    console.log("linkage: MISMATCH");
    console.log("  auth.users.id:", authUser.id);
    console.log("  public.users.id:", publicUser.id);
  }

  const userId = publicUser?.id ?? authUser?.id ?? null;
  if (!userId) {
    console.log("\nCannot inspect roles/permissions without a user id.");
    process.exit(0);
  }

  const { data: userRoles, error: userRolesError } = await admin
    .from("user_roles")
    .select("user_id, role_id, roles(id, name, display_name)")
    .eq("user_id", userId);

  console.log("\n--- 4. user_roles ---");
  if (userRolesError) {
    console.error("user_roles query failed:", userRolesError.message);
  } else if (!userRoles?.length) {
    console.log("EMPTY: no rows in user_roles for user_id", userId);
  } else {
    for (const row of userRoles) {
      const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
      console.log({ user_id: row.user_id, role_id: row.role_id, role });
    }
  }

  const roleNames =
    userRoles?.map((row) => {
      const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
      return (role as { name?: string })?.name ?? "UNKNOWN";
    }) ?? [];

  console.log("\n--- 5. FOUNDER role assigned? ---");
  console.log("roles:", roleNames.length ? roleNames.join(", ") : "(none)");
  console.log("has FOUNDER:", roleNames.includes("FOUNDER"));

  const roleIds = userRoles?.map((r) => r.role_id) ?? [];
  let permissionKeys: string[] = [];
  if (roleIds.length) {
    const { data: rolePerms, error: rolePermsError } = await admin
      .from("platform_role_permissions")
      .select("permission_key, effect, role_id")
      .in("role_id", roleIds);

    console.log("\n--- 6. platform_role_permissions (from assigned roles) ---");
    if (rolePermsError) {
      console.error("query failed:", rolePermsError.message);
    } else {
      const denied = new Set(
        rolePerms?.filter((p) => p.effect === "deny").map((p) => p.permission_key) ?? []
      );
      permissionKeys = [
        ...new Set(
          rolePerms
            ?.filter((p) => p.effect === "allow" && !denied.has(p.permission_key))
            .map((p) => p.permission_key) ?? []
        ),
      ].sort();
      console.log("allow count:", permissionKeys.length);
      console.log("keys:", permissionKeys.join(", ") || "(none)");
    }
  } else {
    console.log("\n--- 6. platform_role_permissions ---");
    console.log("skipped — no role_ids");
  }

  console.log("\n--- 7. migration 155 evidence ---");
  const { data: founderRoleRow } = await admin
    .from("roles")
    .select("id, name")
    .eq("name", "FOUNDER")
    .maybeSingle();

  if (!founderRoleRow) {
    console.log("FOUNDER role row missing from roles table");
  } else if (!userRoles?.some((r) => r.role_id === founderRoleRow.id)) {
    console.log(
      "migration 155 NOT reflected in data: FOUNDER role exists but is NOT assigned to Jimmy"
    );
    console.log("FOUNDER role_id:", founderRoleRow.id);
  } else {
    console.log("migration 155 appears APPLIED: Jimmy has FOUNDER role_id", founderRoleRow.id);
  }

  const migrationTables = ["supabase_migrations.schema_migrations", "schema_migrations"];
  let migrationRecorded: string | null = null;
  for (const table of migrationTables) {
    const { data, error } = await admin.from(table).select("version").ilike("version", "%155%");
    if (!error && data?.length) {
      migrationRecorded = data.map((r: { version: string }) => r.version).join(", ");
      break;
    }
  }
  if (migrationRecorded) {
    console.log("schema_migrations contains:", migrationRecorded);
  } else {
    console.log(
      "schema_migrations: could not confirm 155 via API (table may be inaccessible); using user_roles evidence above"
    );
  }

  console.log("\n--- 8. permission resolver sanity (has_permission RPC) ---");
  const sampleKeys = [
    "students.view",
    "finance.view",
    "hr.view",
    "executive.intelligence",
    "certification.view",
  ];
  console.log(
    "Note: has_permission uses auth.uid(); RPC checks below use service role (auth.uid() null) — expect false."
  );
  console.log("Resolved permissions for dashboard should come from platform_role_permissions above.");
  for (const key of sampleKeys) {
    const hasKey = permissionKeys.includes(key);
    console.log(`  ${key}: ${hasKey ? "YES (in role bundle)" : "NO"}`);
  }

  console.log("\n=== END READ-ONLY INSPECTION ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
