import { describe, expect, it } from "vitest";
import { pickPrimaryRole } from "@/lib/platform/identity/role-priority";
import { canViewExecutiveDirectorDashboard } from "@/lib/dashboard/executive-director-dashboard";
import type { IdentityContext } from "@/lib/platform/identity/context";

describe("pickPrimaryRole", () => {
  it("prefers EXECUTIVE_DIRECTOR over TEAM_MEMBER", () => {
    expect(pickPrimaryRole(["TEAM_MEMBER", "EXECUTIVE_DIRECTOR"])).toBe(
      "EXECUTIVE_DIRECTOR"
    );
  });

  it("prefers FOUNDER over other roles", () => {
    expect(pickPrimaryRole(["EXECUTIVE_DIRECTOR", "FOUNDER"])).toBe("FOUNDER");
  });
});

describe("canViewExecutiveDirectorDashboard", () => {
  function ctx(partial: Partial<IdentityContext>): IdentityContext {
    return {
      id: "u1",
      email: "ed@example.com",
      fullName: "ED",
      roles: [],
      primaryRole: null,
      roleLabel: "",
      permissions: [],
      effectiveUserId: "u1",
      orgAssignments: [],
      accessibleSchoolIds: [],
      hasUnrestrictedSchoolAccess: false,
      isEnterpriseAdmin: false,
      isFounder: false,
      preferences: null,
      impersonation: null,
      ...partial,
    };
  }

  it("grants ED workspace only to EXECUTIVE_DIRECTOR without JAG_ACCESS", () => {
    expect(
      canViewExecutiveDirectorDashboard(
        ctx({
          roles: ["EXECUTIVE_DIRECTOR"],
          permissions: ["ACADEMYOS_ACCESS", "executive.dashboard"],
        })
      )
    ).toBe(true);
  });

  it("denies Founder Edition / JAG users the ED workspace", () => {
    expect(
      canViewExecutiveDirectorDashboard(
        ctx({
          roles: ["FOUNDER", "EXECUTIVE_DIRECTOR"],
          permissions: ["JAG_ACCESS", "ACADEMYOS_ACCESS", "executive.dashboard"],
          isFounder: true,
        })
      )
    ).toBe(false);
  });

  it("denies TEAM_MEMBER the ED workspace even with ACADEMYOS_ACCESS", () => {
    expect(
      canViewExecutiveDirectorDashboard(
        ctx({
          roles: ["TEAM_MEMBER"],
          permissions: ["ACADEMYOS_ACCESS", "executive.dashboard"],
        })
      )
    ).toBe(false);
  });
});
