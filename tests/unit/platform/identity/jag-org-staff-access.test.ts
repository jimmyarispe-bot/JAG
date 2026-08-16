/**
 * Narrow dual-product staff role — JAG_ORG_ACCESS + ACADEMYOS_ACCESS only.
 * Internal role id must never appear as user-facing "Mentor" copy.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  authorize,
  buildAuthzSnapshot,
} from "@/lib/platform/identity/authorization-service";
import {
  authorizeFinanceEntry,
  isFinancialSecurityRoute,
} from "@/lib/platform/identity/financial-security";
import {
  authorizeJagEntry,
  canEnterJag,
} from "@/lib/platform/identity/founder-protection";
import {
  isJagOrganizationOperator,
  isJagPlatformSteward,
  resolveJagAuthorityKind,
} from "@/lib/platform/identity/jag-authority";
import {
  permissionGroupsForRole,
  permissionsForMappedRole,
  roleHasPermissionGroup,
} from "@/lib/platform/identity/permission-groups";
import { authorizeRoute } from "@/lib/platform/identity/route-authorization";

const ROOT = process.cwd();
const ROLE = "JAG_ORG_STAFF" as const;

describe("JAG_ORG_STAFF narrow dual-product access", () => {
  it("grants only JAG_ORG_ACCESS and ACADEMYOS_ACCESS groups", () => {
    expect(permissionGroupsForRole(ROLE)).toEqual([
      "JAG_ORG_ACCESS",
      "ACADEMYOS_ACCESS",
    ]);
    expect(roleHasPermissionGroup(ROLE, "FINANCE_ACCESS")).toBe(false);
    expect(roleHasPermissionGroup(ROLE, "REPORTING_ACCESS")).toBe(false);
    expect(roleHasPermissionGroup(ROLE, "USER_MANAGEMENT_ACCESS")).toBe(false);
    expect(roleHasPermissionGroup(ROLE, "JAG_ACCESS")).toBe(false);
    expect(roleHasPermissionGroup(ROLE, "SYSTEM_ADMIN_ACCESS")).toBe(false);
    expect(roleHasPermissionGroup(ROLE, "AUDIT_ACCESS")).toBe(false);
  });

  it("resolves entry permissions and excludes privileged catalog gates", () => {
    const keys = permissionsForMappedRole(ROLE);
    expect(keys).toContain("JAG_ORG_ACCESS");
    expect(keys).toContain("ACADEMYOS_ACCESS");
    expect(keys).not.toContain("FINANCE_ACCESS");
    expect(keys).not.toContain("REPORTING_ACCESS");
    expect(keys).not.toContain("USER_MANAGEMENT_ACCESS");
    expect(keys).not.toContain("JAG_ACCESS");
    expect(keys).not.toContain("JAG_PLATFORM_ADMIN");
    expect(keys).not.toContain("users.manage");
    expect(keys).not.toContain("roles.manage");
    expect(keys).not.toContain("founder.override");
  });

  it("can enter The JAG as an org operator (not platform steward)", () => {
    const snap = buildAuthzSnapshot("u-staff", [ROLE]);
    expect(authorizeJagEntry(snap)).toBe(true);
    expect(canEnterJag(snap)).toBe(true);
    expect(isJagOrganizationOperator(snap)).toBe(true);
    expect(isJagPlatformSteward(snap)).toBe(false);
    expect(resolveJagAuthorityKind(snap)).toBe("organization");

    const jag = authorizeRoute(snap, "/jag");
    expect(jag.ok).toBe(true);
    expect(authorizeRoute(snap, "/jag/users").ok).toBe(false);
  });

  it("can enter AcademyOS dashboard routes", () => {
    const snap = buildAuthzSnapshot("u-staff", [ROLE]);
    expect(authorize(snap, "ACADEMYOS_ACCESS")).toBe(true);

    const dashboard = authorizeRoute(snap, "/dashboard");
    expect(dashboard.ok).toBe(true);
  });

  it("cannot access finance routes or finance entry", () => {
    const snap = buildAuthzSnapshot("u-staff", [ROLE]);
    expect(authorizeFinanceEntry(snap)).toBe(false);
    expect(authorize(snap, "FINANCE_ACCESS")).toBe(false);

    expect(isFinancialSecurityRoute("/dashboard/finance")).toBe(true);
    const finance = authorizeRoute(snap, "/dashboard/finance");
    expect(finance.ok).toBe(false);
    if (!finance.ok) {
      expect(finance.missing).toBe("FINANCE_ACCESS");
    }
  });

  it("cannot access user-management or role administration permissions", () => {
    const snap = buildAuthzSnapshot("u-staff", [ROLE]);
    expect(authorize(snap, "USER_MANAGEMENT_ACCESS")).toBe(false);
    expect(authorize(snap, "users.manage")).toBe(false);
    expect(authorize(snap, "roles.manage")).toBe(false);
    expect(authorize(snap, "SYSTEM_ADMIN_ACCESS")).toBe(false);
  });

  it("cannot access founder / platform-owner functionality", () => {
    const snap = buildAuthzSnapshot("u-staff", [ROLE]);
    expect(authorize(snap, "JAG_ACCESS")).toBe(false);
    expect(authorize(snap, "JAG_PLATFORM_ADMIN")).toBe(false);
    expect(isJagPlatformSteward(snap)).toBe(false);
    expect(snap.roles).not.toContain("FOUNDER");
    expect(snap.roles).not.toContain("PLATFORM_OWNER");
  });

  it("migration seeds Staff display name and narrow grants only", () => {
    const sql = readFileSync(
      join(ROOT, "supabase/migrations/219_jag_org_staff_role.sql"),
      "utf8"
    );
    expect(sql).toContain("JAG_ORG_STAFF");
    expect(sql).toContain("'Staff'");
    expect(sql).toContain("JAG_ORG_ACCESS");
    expect(sql).toContain("ACADEMYOS_ACCESS");
    expect(sql).toContain("user_organization_memberships");
    expect(sql).not.toMatch(/REPORTING_ACCESS/);
    expect(sql).not.toMatch(/FINANCE_ACCESS/);
    expect(sql).not.toMatch(/USER_MANAGEMENT_ACCESS/);
    expect(sql).not.toMatch(/'JAG_ACCESS'/);
    expect(sql).not.toMatch(/'JAG_PLATFORM_ADMIN'/);
    expect(sql).not.toMatch(/Mentor/i);
  });

  it("does not expose Mentor; migration display_name is Staff", () => {
    const mapping = readFileSync(
      join(ROOT, "src/lib/platform/identity/permission-groups.ts"),
      "utf8"
    );
    const migration = readFileSync(
      join(ROOT, "supabase/migrations/219_jag_org_staff_role.sql"),
      "utf8"
    );
    expect(mapping).toContain("JAG_ORG_STAFF");
    expect(mapping).toContain("display_name: Staff");
    expect(mapping).not.toMatch(/Mentor/i);
    expect(migration).toContain("display_name");
    expect(migration).toContain("'Staff'");
    expect(migration).not.toMatch(/Mentor/i);
  });
});
