import { describe, expect, it } from "vitest";
import type { IdentityContext } from "@/lib/platform/identity/context";
import {
  ADMISSIONS_BOARD_HREF,
  admissionsOpensOnBoard,
  landsOnAdmissionsBoard,
} from "@/lib/dashboard/landing";

/**
 * WHO LANDS WHERE.
 *
 * Two defaults, decided in one file rather than as role checks scattered
 * through two page components. The same question answered in three places is
 * how every workspace in the network ended up titled The Academy FL.
 *
 * These choose which screen is already open on arrival. They are NOT access
 * boundaries - every tab and route stays reachable for anyone whose permissions
 * allow it - so nothing here may ever be the thing that keeps somebody out.
 */

function person(...roles: string[]): IdentityContext {
  return { roles } as unknown as IdentityContext;
}

/** Danni Treu's actual roles, read out of the database on 18 September 2026. */
const DANNI = person("EXECUTIVE_DIRECTOR", "PLATFORM_OWNER", "JAG_ORG_ADMIN");

describe("Admissions opens on the board", () => {
  it.each(["FOUNDER", "CEO", "EXECUTIVE_DIRECTOR"])("for %s", (role) => {
    expect(admissionsOpensOnBoard(person(role))).toBe(true);
  });

  it("for Danni, with all three of her roles", () => {
    expect(admissionsOpensOnBoard(DANNI)).toBe(true);
  });

  it.each(["SCHOOL_LEADER", "TEACHER", "REGISTRAR"])("not for %s", (role) => {
    expect(admissionsOpensOnBoard(person(role))).toBe(false);
  });

  it("is case-insensitive about role names", () => {
    expect(admissionsOpensOnBoard(person("ceo"))).toBe(true);
  });

  it("survives a person with no roles at all", () => {
    expect(admissionsOpensOnBoard({} as IdentityContext)).toBe(false);
  });
});

describe("Signing in goes straight to the board", () => {
  /**
   * THE ONE THAT MATTERS, AND THE ONE THAT WAS WRONG.
   *
   * The first version checked for CEO - a role name that appears in an RLS
   * policy and on nobody's account. The redirect matched no one, and Danni kept
   * landing on the founder dashboard, which her PLATFORM_OWNER and
   * JAG_ORG_ADMIN roles unlock through JAG_ACCESS. Asserting against her real
   * roles is what stops that being guessed at again.
   */
  it("for Danni", () => {
    expect(landsOnAdmissionsBoard(DANNI)).toBe(true);
  });

  it("for a plain Executive Director", () => {
    expect(landsOnAdmissionsBoard(person("EXECUTIVE_DIRECTOR"))).toBe(true);
  });

  it("for a CEO, if anyone ever holds it", () => {
    expect(landsOnAdmissionsBoard(person("CEO"))).toBe(true);
  });

  /**
   * The founder dashboard leads with the numbers on purpose. Redirecting past
   * it would quietly delete a screen somebody built deliberately.
   */
  it("never for the founder", () => {
    expect(landsOnAdmissionsBoard(person("FOUNDER"))).toBe(false);
    expect(landsOnAdmissionsBoard(person("FOUNDER", "CEO"))).toBe(false);
    expect(landsOnAdmissionsBoard(person("FOUNDER", "EXECUTIVE_DIRECTOR"))).toBe(false);
  });

  /** Platform admin is not an operating role and must not move anybody. */
  it.each(["PLATFORM_OWNER", "JAG_ORG_ADMIN"])("not for %s alone", (role) => {
    expect(landsOnAdmissionsBoard(person(role))).toBe(false);
  });

  it("not for a School Leader", () => {
    expect(landsOnAdmissionsBoard(person("SCHOOL_LEADER"))).toBe(false);
  });
});

describe("the board's address", () => {
  /** One constant, so the redirect and the default cannot drift apart. */
  it("is the pipeline view", () => {
    expect(ADMISSIONS_BOARD_HREF).toBe("/dashboard/admissions?view=pipeline");
  });
});
