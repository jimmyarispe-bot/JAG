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

/**
 * EVERYONE, SINCE 10 OCTOBER 2026.
 *
 * This block used to assert the opposite for three roles, and it was right to
 * until the day the tabs were hidden. Jimmy, asked where a school leader
 * should land now that the Pipeline Board tab is gone from her screen: "all
 * land on the pipeline board".
 *
 * Before that change Nina Gaddy and Heather Badger-Brown landed on a task
 * list and reached the board through the tab the same commit removed, so
 * leaving this rule alone would have left the two people who actually run
 * admissions unable to reach the board at all.
 *
 * STILL NOT A BOUNDARY. Whether a person may open Admissions is decided by
 * requirePagePermission in the layout and by row-level security underneath
 * it. This only answers which screen is already open when they arrive, which
 * is why a person with no roles gets true here and still sees nothing.
 */
describe("Admissions opens on the board", () => {
  it.each([
    "FOUNDER",
    "CEO",
    "EXECUTIVE_DIRECTOR",
    "SCHOOL_LEADER",
    "TEACHER",
    "REGISTRAR",
  ])("for %s", (role) => {
    expect(admissionsOpensOnBoard(person(role))).toBe(true);
  });

  it("for Danni, with all three of her roles", () => {
    expect(admissionsOpensOnBoard(DANNI)).toBe(true);
  });

  it("for a person with no roles at all", () => {
    expect(admissionsOpensOnBoard({} as IdentityContext)).toBe(true);
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

  /*
   * Moved here on 10 October from the block above, where it stopped meaning
   * anything the moment that rule returned true for everybody. Role names
   * still arrive in whatever case the database holds them, and this is now
   * the only rule that reads them.
   */
  it("is case-insensitive about role names", () => {
    expect(landsOnAdmissionsBoard(person("ceo"))).toBe(true);
    expect(landsOnAdmissionsBoard(person("founder"))).toBe(false);
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

  /**
   * CHANGED 10 OCTOBER 2026, and this test was right until that morning.
   *
   * A school leader used to land on Home and reach the board through a
   * Quick Launch tile. Then the tabs came off her Admissions page, leaving
   * the board as the only screen there - and she was still being shown a
   * menu first. Jimmy, looking at Nina's screen: "why isnt it current
   * students pipeline".
   */
  it("for a School Leader — Nina and Heather", () => {
    expect(landsOnAdmissionsBoard(person("SCHOOL_LEADER"))).toBe(true);
  });

  /** A teacher's morning is her roster, not a funnel. */
  it.each(["TEACHER", "TEAM_MEMBER", "REGISTRAR"])("not for %s", (role) => {
    expect(landsOnAdmissionsBoard(person(role))).toBe(false);
  });
});

describe("the board's address", () => {
  /** One constant, so the redirect and the default cannot drift apart. */
  it("is the pipeline view", () => {
    expect(ADMISSIONS_BOARD_HREF).toBe("/dashboard/admissions?view=pipeline");
  });
});
