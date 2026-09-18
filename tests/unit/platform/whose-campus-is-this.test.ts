import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * WHOSE CAMPUS IS THIS WORKSPACE?
 *
 * 17 September 2026. Jimmy Arispe, Founder & CEO of a four-campus network,
 * opened Admissions and the page was titled "The Academy FL". So was every
 * School Leader's, regardless of assignment.
 *
 * The scope read `primary?.school_id ?? accessibleSchoolIds[0]`. That array
 * comes back in no defined order, so "[0]" means "whichever school Postgres
 * returned first" - which for this network is The Academy FL, every time.
 *
 * This is the THIRD place the same fault appeared. identity/context.ts read
 * orgAssignments[0] with no ORDER BY (fixed 15 September, migration 370 and
 * primary-campus.test.ts). school-leader/experience/access.ts did the same.
 * This one survived both because it reads a different array.
 *
 * Source assertions: the fault is an absence - no rule said what to do when
 * there is no single answer, so the code picked one anyway.
 */

const root = join(__dirname, "..", "..", "..");
const resolve = readFileSync(
  join(root, "src/lib/platform/jag-organization/resolve.ts"),
  "utf8"
);

describe("the active scope", () => {
  it("has one place that decides which school you are looking at", () => {
    expect(resolve).toContain("function scopedSchoolId");
  });

  /**
   * THE ONE THAT MATTERS. Someone who can see every campus is not "at" one of
   * them, and naming one means picking arbitrarily from four.
   */
  it("gives unrestricted access the network, not a campus", () => {
    expect(resolve).toMatch(
      /if \(identity\.hasUnrestrictedSchoolAccess\) return null;/
    );
  });

  it("honours an explicit primary assignment", () => {
    expect(resolve).toContain("if (primary?.school_id) return primary.school_id;");
  });

  /** One accessible school is an answer. Several is a guess. */
  it("only uses an accessible school when there is exactly one", () => {
    expect(resolve).toContain("identity.accessibleSchoolIds.length === 1");
  });

  /**
   * The exact old shape. Anywhere this returns to the display path, every
   * workspace in the network is titled with whatever sorts first.
   */
  it("never labels a workspace with an arbitrary first school", () => {
    const displayPath = resolve.slice(
      resolve.indexOf("function resolveActiveScope"),
      resolve.indexOf("function resolveOwnership")
    );
    expect(
      displayPath,
      "resolveActiveScope is back to picking accessibleSchoolIds[0]"
    ).not.toContain("accessibleSchoolIds[0]");
  });
});
