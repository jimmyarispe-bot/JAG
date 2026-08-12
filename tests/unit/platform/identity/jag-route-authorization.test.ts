/**
 * JAG route gate — FOUNDER (with JAG_ORG_ACCESS via PERMISSION_KEYS) allowed;
 * AcademyOS-only users without JAG_ORG_ACCESS denied.
 */

import { describe, expect, it } from "vitest";
import { buildAuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import { authorizeJagEntry } from "@/lib/platform/identity/founder-protection";
import { permissionsForMappedRole } from "@/lib/platform/identity/permission-groups";
import { authorizeRoute } from "@/lib/platform/identity/route-authorization";

describe("JAG /jag route authorization", () => {
  it("allows FOUNDER who receives JAG_ORG_ACCESS into The JAG", () => {
    const founderKeys = permissionsForMappedRole("FOUNDER");
    expect(founderKeys).toContain("JAG_ORG_ACCESS");
    expect(founderKeys).toContain("JAG_ACCESS");

    const snapshot = buildAuthzSnapshot("user-founder", ["FOUNDER"]);
    expect(authorizeJagEntry(snapshot)).toBe(true);

    const decision = authorizeRoute(snapshot, "/jag");
    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.required).toContain("JAG_ACCESS");
  });

  it("denies AcademyOS-only users without JAG_ORG_ACCESS", () => {
    for (const role of ["TEAM_MEMBER", "CEO", "EXECUTIVE_DIRECTOR"] as const) {
      const keys = permissionsForMappedRole(role);
      expect(keys).not.toContain("JAG_ORG_ACCESS");
      expect(keys).not.toContain("JAG_ACCESS");

      const snapshot = buildAuthzSnapshot(`user-${role}`, [role]);
      expect(authorizeJagEntry(snapshot)).toBe(false);

      const decision = authorizeRoute(snapshot, "/jag");
      expect(decision.ok).toBe(false);
      if (decision.ok) return;
      expect(decision.redirectTo).toBe("/dashboard");
      expect(decision.missing).toBe("JAG_ORG_ACCESS");
    }
  });
});
