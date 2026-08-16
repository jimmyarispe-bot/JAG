import { describe, expect, it } from "vitest";
import {
  isJagOnlyProvisionRoles,
  needsAuthUserProvisioning,
} from "@/lib/platform/identity/provision-auth-user";

describe("needsAuthUserProvisioning", () => {
  it("returns false when profile, role, and org assignment exist", () => {
    expect(
      needsAuthUserProvisioning({
        hasProfile: true,
        hasRole: true,
        hasOrgAssignment: true,
        jagPlatformOnly: false,
      })
    ).toBe(false);
  });

  it("returns true when any required AcademyOS provision row is missing", () => {
    expect(
      needsAuthUserProvisioning({
        hasProfile: false,
        hasRole: true,
        hasOrgAssignment: true,
        jagPlatformOnly: false,
      })
    ).toBe(true);
    expect(
      needsAuthUserProvisioning({
        hasProfile: true,
        hasRole: false,
        hasOrgAssignment: true,
        jagPlatformOnly: false,
      })
    ).toBe(true);
    expect(
      needsAuthUserProvisioning({
        hasProfile: true,
        hasRole: true,
        hasOrgAssignment: false,
        jagPlatformOnly: false,
      })
    ).toBe(true);
  });

  it("does not re-heal JAG-only users that have no AcademyOS membership", () => {
    expect(
      needsAuthUserProvisioning({
        hasProfile: true,
        hasRole: true,
        hasOrgAssignment: false,
        jagPlatformOnly: true,
      })
    ).toBe(false);
  });

  it("still heals JAG-only users missing a profile or role", () => {
    expect(
      needsAuthUserProvisioning({
        hasProfile: false,
        hasRole: true,
        hasOrgAssignment: false,
        jagPlatformOnly: true,
      })
    ).toBe(true);
    expect(
      needsAuthUserProvisioning({
        hasProfile: true,
        hasRole: false,
        hasOrgAssignment: false,
        jagPlatformOnly: true,
      })
    ).toBe(true);
  });
});

describe("isJagOnlyProvisionRoles", () => {
  it("treats PLATFORM_OWNER / PLATFORM_ADMIN without AcademyOS roles as JAG-only", () => {
    expect(isJagOnlyProvisionRoles(["PLATFORM_OWNER"])).toBe(true);
    expect(isJagOnlyProvisionRoles(["PLATFORM_ADMIN"])).toBe(true);
    expect(isJagOnlyProvisionRoles(["TEAM_MEMBER", "PLATFORM_OWNER"])).toBe(
      true
    );
  });

  it("does not treat Stacy (CEO + PLATFORM_OWNER) as JAG-only", () => {
    expect(isJagOnlyProvisionRoles(["CEO", "PLATFORM_OWNER"])).toBe(false);
  });

  it("does not treat Jimmy (FOUNDER) as JAG-only", () => {
    expect(isJagOnlyProvisionRoles(["FOUNDER"])).toBe(false);
  });

  it("does not treat AcademyOS TEAM_MEMBER as JAG-only", () => {
    expect(isJagOnlyProvisionRoles(["TEAM_MEMBER"])).toBe(false);
    expect(isJagOnlyProvisionRoles([])).toBe(false);
  });
});
