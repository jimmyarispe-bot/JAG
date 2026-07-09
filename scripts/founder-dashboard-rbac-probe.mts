/**
 * Diagnose Founder Dashboard RBAC for a seeded user (default: jimmy@academyos.org).
 *
 * Usage:
 *   npx tsx scripts/founder-dashboard-rbac-probe.mts
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  getVisibleFounderDashboardCards,
  type FounderDashboardCardKey,
} from "../src/lib/dashboard/founder-dashboard-access";
import { canAccessExecutiveIntelligence } from "../src/lib/executive/access";
import { canViewFi } from "../src/lib/financial-intelligence/access";
import type { IdentityContext } from "../src/lib/platform/identity/context";
import type { OrgAssignment } from "../src/lib/platform/identity/types";

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
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("=== Founder Dashboard RBAC Probe ===");
  console.log("email:", EMAIL);

  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("id, email, full_name")
    .ilike("email", EMAIL)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("User not found in public.users:", profileError?.message ?? EMAIL);
    process.exit(1);
  }

  console.log("\n--- Database: user profile ---");
  console.log(profile);

  const { data: userRoles, error: userRolesError } = await admin
    .from("user_roles")
    .select("role_id, roles(name, display_name)")
    .eq("user_id", profile.id);

  if (userRolesError) {
    console.error("user_roles query failed:", userRolesError.message);
    process.exit(1);
  }

  const roleNames =
    userRoles?.map((row) => {
      const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
      return (role as { name?: string; display_name?: string | null })?.name ?? "UNKNOWN";
    }) ?? [];

  console.log("\n--- Database: assigned roles ---");
  if (!userRoles?.length) {
    console.log("(none — user_roles is empty)");
  } else {
    for (const row of userRoles) {
      const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
      console.log("-", role);
    }
  }

  const hasFounderRole = roleNames.includes("FOUNDER");
  const hasCeoRole = roleNames.includes("CEO");
  const hasExecutiveDirectorRole = roleNames.includes("EXECUTIVE_DIRECTOR");
  const isEnterpriseAdmin = roleNames.some((r) =>
    ["FOUNDER", "CEO", "EXECUTIVE_DIRECTOR"].includes(r)
  );

  console.log("\n--- Seed comparison ---");
  console.log("Expected (migration 155): FOUNDER role on jimmy@academyos.org");
  console.log("Original seed (056): SCHOOL_LEADER on jimmy@academyos.org");
  console.log("Has FOUNDER role in DB:", hasFounderRole);
  console.log("Has CEO role in DB:", hasCeoRole);
  console.log("Has EXECUTIVE_DIRECTOR role in DB:", hasExecutiveDirectorRole);
  console.log("Computed isEnterpriseAdmin:", isEnterpriseAdmin);
  if (!isEnterpriseAdmin) {
    console.log(
      "isEnterpriseAdmin is FALSE because roles do not include FOUNDER, CEO, or EXECUTIVE_DIRECTOR."
    );
    console.log("Actual roles:", roleNames.length ? roleNames.join(", ") : "(empty)");
  }

  const roleIds = userRoles?.map((r) => r.role_id) ?? [];
  let permissionKeys: string[] = [];

  if (roleIds.length) {
    const { data: rolePerms, error: rolePermsError } = await admin
      .from("platform_role_permissions")
      .select("permission_key, effect")
      .in("role_id", roleIds);

    if (rolePermsError) {
      console.error("platform_role_permissions query failed:", rolePermsError.message);
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
    }
  }

  console.log("\n--- Database: role permissions (allow, deduped) ---");
  console.log("count:", permissionKeys.length);
  if (permissionKeys.length) {
    console.log(permissionKeys.join(", "));
  } else {
    console.log("(none from platform_role_permissions)");
  }

  const { data: orgRows } = await admin
    .from("user_org_assignments")
    .select("*, schools(name)")
    .eq("user_id", profile.id);

  let orgAssignments: OrgAssignment[] = (orgRows as OrgAssignment[] | null) ?? [];
  if (!orgAssignments.length) {
    const { data: legacy } = await admin
      .from("user_schools")
      .select("school_id, schools(name)")
      .eq("user_id", profile.id);
    orgAssignments =
      legacy?.map((row, i) => ({
        id: row.school_id,
        school_id: row.school_id,
        campus_id: null,
        program_id: null,
        department_id: null,
        all_campuses: true,
        all_programs: true,
        is_primary: i === 0,
        schools: (Array.isArray(row.schools) ? row.schools[0] : row.schools) as { name: string } | null,
      })) ?? [];
  }

  const ctx: IdentityContext = {
    id: profile.id,
    email: profile.email ?? EMAIL,
    fullName: profile.full_name ?? "User",
    roles: roleNames as IdentityContext["roles"],
    primaryRole: (roleNames[0] as IdentityContext["primaryRole"]) ?? null,
    roleLabel: roleNames[0] ?? "Team Member",
    effectiveUserId: profile.id,
    permissions: permissionKeys,
    orgAssignments,
    accessibleSchoolIds: isEnterpriseAdmin
      ? []
      : [...new Set(orgAssignments.map((a) => a.school_id))],
    hasUnrestrictedSchoolAccess: isEnterpriseAdmin,
    isFounder: hasFounderRole,
    isEnterpriseAdmin,
    impersonation: null,
    preferences: null,
  };

  console.log("\n--- Simulated IdentityContext ---");
  console.log({
    roles: ctx.roles,
    isFounder: ctx.isFounder,
    isEnterpriseAdmin: ctx.isEnterpriseAdmin,
    permissionCount: ctx.permissions.length,
    hasExecutiveIntelligence: canAccessExecutiveIntelligence(ctx),
    hasFinancialIntelligence: canViewFi(ctx),
  });

  console.log("\n--- getVisibleFounderDashboardCards() (see [founder-dashboard:rbac] log below) ---");
  const visibleCards = getVisibleFounderDashboardCards(ctx);

  console.log("\n=== Summary ===");
  console.log("visibleCards:", visibleCards);
  console.log("visibleCards.length:", visibleCards.length);

  if (visibleCards.length === 0) {
    console.log("\nROOT CAUSE: visibleCards is empty.");
    if (!roleNames.length) {
      console.log("- No roles in user_roles → isEnterpriseAdmin=false, permissions=[]");
    } else if (!isEnterpriseAdmin && permissionKeys.length === 0) {
      console.log("- Roles present but no platform_role_permissions loaded for those roles");
    } else if (!isEnterpriseAdmin) {
      console.log("- isEnterpriseAdmin=false and no card-specific permission checks passed");
      console.log("- Check [founder-dashboard:rbac] cardDecisions above for each exclusion reason");
    }
  } else {
    const allCards = Object.keys({
      activeEnrollment: 1,
      admissionsPipeline: 1,
      monthlyRevenue: 1,
      tuitionOutstanding: 1,
      staffCount: 1,
      teacherAttendance: 1,
      studentAttendance: 1,
      upcomingClasses: 1,
      executiveAlerts: 1,
      financialIntelligence: 1,
    }) as FounderDashboardCardKey[];
    const excluded = allCards.filter((c) => !visibleCards.includes(c));
    if (excluded.length) {
      console.log("excluded cards:", excluded);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
