import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildAuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import { authorizeRoute } from "@/lib/platform/identity/route-authorization";
import { authorizeJagEntry } from "@/lib/platform/identity/founder-protection";
import {
  isJagOrganizationOperator,
  isJagPlatformSteward,
} from "@/lib/platform/identity/jag-authority";
import { resolveJagOrganizationContext } from "@/lib/jag-platform/org-context";
import { USER_MANAGEMENT_ROLE_OPTIONS } from "@/lib/platform/identity/user-management-catalog";
import {
  academyOsRolesFrom,
  buildJagOnlyAuthMetadata,
  effectiveJagPlatformPermissions,
  hasJagPlatformAccess,
  jagOnlyAuthMetadataHasPrivilegeSignals,
  JAG_ONLY_PROVISION_RPC,
  JAG_PLATFORM_GRANT_ROLE,
  JAG_PLATFORM_USERS_PATH,
  JIMMY_ARISPE_JAG_ROLES,
  STACY_KENWORTHY_ACADEMYOS_ROLES,
  STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES,
  jagPlatformAccessRolesFrom,
  jagPlatformPermissionUniverse,
  jagPlatformPermissionsEqual,
} from "@/lib/jag-platform/platform-access";

const ROOT = process.cwd();

describe("JAG platform user access", () => {
  it("computes Jimmy's effective JAG permission set from FOUNDER", () => {
    const jimmy = effectiveJagPlatformPermissions(JIMMY_ARISPE_JAG_ROLES);
    expect(jimmy).toEqual(jagPlatformPermissionUniverse());
    expect(jimmy).toContain("JAG_ACCESS");
    expect(jimmy).toContain("JAG_PLATFORM_ADMIN");
    expect(jimmy).not.toContain("JAG_ORG_ACCESS");
    expect(hasJagPlatformAccess(JIMMY_ARISPE_JAG_ROLES)).toBe(true);
  });

  it("computes Stacy's effective JAG permission set after PLATFORM_OWNER grant", () => {
    const stacy = effectiveJagPlatformPermissions(
      STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES
    );
    expect(stacy).toEqual(jagPlatformPermissionUniverse());
    expect(hasJagPlatformAccess(STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES)).toBe(
      true
    );
  });

  it("Jimmy and Stacy have identical effective JAG permissions", () => {
    expect(
      jagPlatformPermissionsEqual(
        JIMMY_ARISPE_JAG_ROLES,
        STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES
      )
    ).toBe(true);
  });

  it("keeps Stacy's AcademyOS CEO role after JAG grant", () => {
    expect(academyOsRolesFrom(STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES)).toEqual([
      "CEO",
    ]);
    expect(STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES).toContain("CEO");
    expect(STACY_KENWORTHY_ACADEMYOS_ROLES).toEqual(["CEO"]);
  });

  it("does not treat AcademyOS membership as a JAG grant input", () => {
    expect(hasJagPlatformAccess(STACY_KENWORTHY_ACADEMYOS_ROLES)).toBe(false);
    expect(
      effectiveJagPlatformPermissions(STACY_KENWORTHY_ACADEMYOS_ROLES)
    ).toEqual([]);
  });

  it("JAG-only PLATFORM_OWNER can exist without organization membership", async () => {
    const snap = buildAuthzSnapshot("jag-only", ["PLATFORM_OWNER"]);
    expect(isJagPlatformSteward(snap)).toBe(true);
    expect(authorizeJagEntry(snap)).toBe(true);

    const ctx = await resolveJagOrganizationContext(
      {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: async () => ({ data: [] }),
              }),
            }),
          }),
        }),
      } as never,
      "jag-only",
      snap
    );
    expect(ctx).toEqual({
      authority: "platform",
      organizationId: null,
      membershipRole: null,
    });
  });

  it("AcademyOS membership / CEO does not grant JAG access", () => {
    const snap = buildAuthzSnapshot("stacy-ceo", ["CEO"]);
    expect(authorizeJagEntry(snap)).toBe(false);
    expect(isJagPlatformSteward(snap)).toBe(false);
    expect(authorizeRoute(snap, "/jag").ok).toBe(false);
    expect(authorizeRoute(snap, JAG_PLATFORM_USERS_PATH).ok).toBe(false);
  });

  it("JAG access does not require or imply an organization membership", async () => {
    const snap = buildAuthzSnapshot("jimmy", ["FOUNDER"]);
    const ctx = await resolveJagOrganizationContext(
      {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: async () => ({ data: [] }),
              }),
            }),
          }),
        }),
      } as never,
      "jimmy",
      snap
    );
    expect(ctx?.authority).toBe("platform");
    expect(ctx?.organizationId).toBeNull();
  });

  it("keeps JAG_ACCESS distinct from JAG_ORG_ACCESS", () => {
    const universe = jagPlatformPermissionUniverse();
    expect(universe).toContain("JAG_ACCESS");
    expect(universe).not.toContain("JAG_ORG_ACCESS");

    const orgOnly = buildAuthzSnapshot("org-admin", ["JAG_ORG_ADMIN"]);
    expect(isJagOrganizationOperator(orgOnly)).toBe(true);
    expect(isJagPlatformSteward(orgOnly)).toBe(false);
    expect(authorizeRoute(orgOnly, JAG_PLATFORM_USERS_PATH).ok).toBe(false);
  });

  it("denies unauthorized roles from /jag/users", () => {
    for (const role of ["CEO", "JAG_ORG_ADMIN", "TEACHER"]) {
      const snap = buildAuthzSnapshot(`deny-${role}`, [role]);
      const decision = authorizeRoute(snap, JAG_PLATFORM_USERS_PATH);
      expect(decision.ok).toBe(false);
    }
  });

  it("allows FOUNDER and PLATFORM_OWNER onto /jag/users", () => {
    expect(
      authorizeRoute(buildAuthzSnapshot("jimmy", ["FOUNDER"]), JAG_PLATFORM_USERS_PATH)
        .ok
    ).toBe(true);
    expect(
      authorizeRoute(
        buildAuthzSnapshot("stacy", ["CEO", "PLATFORM_OWNER"]),
        JAG_PLATFORM_USERS_PATH
      ).ok
    ).toBe(true);
  });

  it("does not change Jimmy's JAG role model", () => {
    expect(jagPlatformAccessRolesFrom(JIMMY_ARISPE_JAG_ROLES)).toEqual([
      "FOUNDER",
    ]);
    expect(JAG_PLATFORM_GRANT_ROLE).toBe("PLATFORM_OWNER");
    expect(JAG_PLATFORM_GRANT_ROLE).not.toBe("FOUNDER");
  });

  it("leaves AcademyOS user-management catalog unchanged", () => {
    const values = USER_MANAGEMENT_ROLE_OPTIONS.map((option) => option.value);
    expect(values).not.toContain("PLATFORM_OWNER");
    expect(values).not.toContain("PLATFORM_ADMIN");
    expect(values).toContain("CEO");
  });

  it("does not use JAG_ORG_ADMIN as the JAG platform grant", () => {
    expect(JAG_PLATFORM_GRANT_ROLE).not.toBe("JAG_ORG_ADMIN");
    expect(hasJagPlatformAccess(["JAG_ORG_ADMIN"])).toBe(false);
  });

  it("JAG-only createUser metadata carries display fields only", () => {
    const meta = buildJagOnlyAuthMetadata({
      firstName: "Ada",
      lastName: "Lovelace",
      fullName: "Ada Lovelace",
    });
    expect(meta).toEqual({
      full_name: "Ada Lovelace",
      first_name: "Ada",
      last_name: "Lovelace",
    });
    expect(jagOnlyAuthMetadataHasPrivilegeSignals(meta)).toBe(false);
    expect(JAG_ONLY_PROVISION_RPC).toBe("provision_jag_only_identity");
  });

  it("mounts /jag/users as JAG Platform Users, not AcademyOS admin", () => {
    const page = readFileSync(
      join(ROOT, "src/app/jag/(portal)/users/page.tsx"),
      "utf8"
    );
    const view = readFileSync(
      join(ROOT, "src/components/jag-platform/JagPlatformUsersView.tsx"),
      "utf8"
    );
    const orgUsers = readFileSync(
      join(ROOT, "src/app/dashboard/admin/users/page.tsx"),
      "utf8"
    );
    expect(page).toContain("JAG Platform Users");
    expect(view).toContain("JAG Platform Users");
    expect(view).toContain("not AcademyOS");
    expect(orgUsers).not.toContain("JAG Platform Users");
    expect(orgUsers).toContain("getAdminUsersDirectory");
  });
});
