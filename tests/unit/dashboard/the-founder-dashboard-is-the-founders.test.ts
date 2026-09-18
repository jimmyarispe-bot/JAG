import { describe, expect, it } from "vitest";
import type { IdentityContext } from "@/lib/platform/identity/context";
import { canViewFounderDashboard } from "@/lib/dashboard/founder-dashboard-access";

/**
 * THE FOUNDER DASHBOARD IS THE FOUNDER'S.
 *
 * It was gated on the JAG_ACCESS permission, under a comment saying JAG_ACCESS
 * is "granted by FOUNDER role". True, and not the whole truth: PLATFORM_OWNER
 * and JAG_ORG_ADMIN grant it too.
 *
 * So Danni Treu - Executive Director of Schools, who also holds those two
 * administration roles - signed in every morning to a revenue-first founder
 * brief that was never meant for her. Nothing errored. The permission check
 * passed, exactly as written.
 *
 * A permission three roles carry cannot answer "is this the founder". The role
 * can, and this screen is named after it.
 *
 * NOT A MONEY BOUNDARY. Danni keeps every finance key she holds and Finance
 * stays in her sidebar; the tests below say so out loud, because the next
 * person to read this file must not mistake it for one.
 */

function person(...roles: string[]): IdentityContext {
  return { roles } as unknown as IdentityContext;
}

/** Read from the database on 18 September 2026. */
const JIMMY = person("FOUNDER");
const DANNI = person("EXECUTIVE_DIRECTOR", "PLATFORM_OWNER", "JAG_ORG_ADMIN");

describe("who sees the founder dashboard", () => {
  it("the founder does", () => {
    expect(canViewFounderDashboard(JIMMY)).toBe(true);
  });

  /** THE ONE THAT MATTERS. */
  it("Danni does not, with all three of her roles", () => {
    expect(
      canViewFounderDashboard(DANNI),
      "the Executive Director is back on the founder's morning brief"
    ).toBe(false);
  });

  /**
   * The exact shape of the old bug: an administration role carrying a
   * permission that stood in for identity.
   */
  it.each(["PLATFORM_OWNER", "JAG_ORG_ADMIN", "EXECUTIVE_DIRECTOR"])(
    "%s alone does not",
    (role) => {
      expect(canViewFounderDashboard(person(role))).toBe(false);
    }
  );

  it("nobody with no roles does", () => {
    expect(canViewFounderDashboard({} as IdentityContext)).toBe(false);
  });

  it("is case-insensitive about the role name", () => {
    expect(canViewFounderDashboard(person("founder"))).toBe(true);
  });
});
