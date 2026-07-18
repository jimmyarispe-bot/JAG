import { describe, expect, it } from "vitest";
import { needsAuthUserProvisioning } from "@/lib/platform/identity/provision-auth-user";

describe("needsAuthUserProvisioning", () => {
  it("returns false when profile, role, and org assignment exist", () => {
    expect(
      needsAuthUserProvisioning({
        hasProfile: true,
        hasRole: true,
        hasOrgAssignment: true,
      })
    ).toBe(false);
  });

  it("returns true when any required provision row is missing", () => {
    expect(
      needsAuthUserProvisioning({
        hasProfile: false,
        hasRole: true,
        hasOrgAssignment: true,
      })
    ).toBe(true);
    expect(
      needsAuthUserProvisioning({
        hasProfile: true,
        hasRole: false,
        hasOrgAssignment: true,
      })
    ).toBe(true);
    expect(
      needsAuthUserProvisioning({
        hasProfile: true,
        hasRole: true,
        hasOrgAssignment: false,
      })
    ).toBe(true);
  });
});
