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

describe("Admissions opens on the board", () => {
  it.each(["FOUNDER", "CEO"])("for %s", (role) => {
    expect(admissionsOpensOnBoard(person(role))).toBe(true);
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
  /** Danni. Admissions, not money. */
  it("for the CEO", () => {
    expect(landsOnAdmissionsBoard(person("CEO"))).toBe(true);
  });

  /**
   * The founder dashboard leads with the numbers on purpose. Redirecting past
   * it would quietly delete a screen somebody built deliberately.
   */
  it("never for the founder", () => {
    expect(landsOnAdmissionsBoard(person("FOUNDER"))).toBe(false);
    expect(landsOnAdmissionsBoard(person("FOUNDER", "CEO"))).toBe(false);
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
