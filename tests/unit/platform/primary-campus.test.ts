import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Whose campus a person is shown.
 *
 * 15 September 2026. Heather Badger-Brown, School Leader for Academy Virtual
 * and The Academy HS, opened an email about Julian Oubre Towa and was shown a
 * decision about Trisha Wilkerson — a 3rd grader at The Academy FL.
 *
 * Two faults. Her account held all four campuses, which is data and is fixed by
 * migration 370. And the code that decides "her campus" read
 * `orgAssignments[0]` out of a query with NO ORDER BY, so the answer was
 * whatever Postgres returned first. `is_primary` was written into the row and
 * read by nothing.
 *
 * That second one is why fixing the data alone would not have been enough, and
 * why it has to stay fixed: it fails silently, it only misbehaves for somebody
 * holding more than one campus, and what it produces is a real workspace full
 * of real children — just not hers.
 *
 * These are source assertions rather than behaviour tests because the fault is
 * an ABSENCE. There is no value to assert on; the bug was a missing clause.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("assignments are read in a defined order", () => {
  const context = read("src/lib/platform/identity/context.ts");

  it("orders user_org_assignments by is_primary", () => {
    expect(context).toContain('.order("is_primary", { ascending: false })');
  });

  /** A tie broken by nothing is the same bug with a smaller blast radius. */
  it("breaks ties deterministically", () => {
    expect(context).toContain('.order("created_at", { ascending: true })');
  });

  it("still reads the assignments table at all", () => {
    expect(context).toContain('.from("user_org_assignments")');
  });
});

describe("the school leader workspace asks for the primary campus", () => {
  const access = read("src/lib/school-leader/experience/access.ts");

  /** THE ONE THAT MATTERS. */
  it("selects the primary assignment explicitly, not row zero", () => {
    expect(access).toContain("orgAssignments.find((a) => a.is_primary)");
  });

  it("keeps a fallback, so a person with no primary still gets a workspace", () => {
    expect(access).toContain("ctx.orgAssignments[0]?.school_id");
  });

  /**
   * The exact shape of the old bug: taking [0] with nothing in front of it.
   * If this string comes back on its own line, somebody has undone the fix.
   */
  it("no longer takes row zero as the only answer", () => {
    expect(access).not.toMatch(
      /const schoolId =\s*ctx\.orgAssignments\[0\]\?\.school_id \?\? null;/
    );
  });
});
