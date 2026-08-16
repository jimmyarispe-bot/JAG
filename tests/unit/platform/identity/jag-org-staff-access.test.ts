/**
 * Release-branch adaptation: org-scoped JAG operators must not reach
 * /jag/users. JAG_ORG_STAFF is not seeded on this release; JAG_ORG_ADMIN is.
 */

import { describe, expect, it } from "vitest";
import {
  authorize,
  buildAuthzSnapshot,
} from "@/lib/platform/identity/authorization-service";
import { authorizeJagEntry } from "@/lib/platform/identity/founder-protection";
import {
  isJagOrganizationOperator,
  isJagPlatformSteward,
} from "@/lib/platform/identity/jag-authority";
import { authorizeRoute } from "@/lib/platform/identity/route-authorization";
import { JAG_PLATFORM_USERS_PATH } from "@/lib/jag-platform/platform-access";

describe("org-scoped JAG cannot administer platform users", () => {
  it("JAG_ORG_ADMIN may enter JAG but not /jag/users", () => {
    const snap = buildAuthzSnapshot("org-admin", ["JAG_ORG_ADMIN"]);
    expect(isJagOrganizationOperator(snap)).toBe(true);
    expect(isJagPlatformSteward(snap)).toBe(false);
    expect(authorizeJagEntry(snap)).toBe(true);
    expect(authorize(snap, "JAG_ACCESS")).toBe(false);
    expect(authorize(snap, "JAG_PLATFORM_ADMIN")).toBe(false);
    expect(authorizeRoute(snap, "/jag").ok).toBe(true);
    expect(authorizeRoute(snap, JAG_PLATFORM_USERS_PATH).ok).toBe(false);
  });

  it("CEO and TEACHER cannot open /jag/users", () => {
    for (const role of ["CEO", "TEACHER"] as const) {
      const snap = buildAuthzSnapshot(`deny-${role}`, [role]);
      expect(authorizeRoute(snap, JAG_PLATFORM_USERS_PATH).ok).toBe(false);
    }
  });

  it("FOUNDER and PLATFORM_OWNER can open /jag/users", () => {
    expect(
      authorizeRoute(buildAuthzSnapshot("founder", ["FOUNDER"]), JAG_PLATFORM_USERS_PATH)
        .ok
    ).toBe(true);
    expect(
      authorizeRoute(
        buildAuthzSnapshot("owner", ["PLATFORM_OWNER"]),
        JAG_PLATFORM_USERS_PATH
      ).ok
    ).toBe(true);
  });
});
