import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { groupForLead } from "@/lib/people/directory-shared";

/**
 * A LIST THAT IS HONEST ABOUT ITS OWN LENGTH.
 *
 * 17 September 2026. Julian Oubre Towa was reported missing from the pipeline
 * for the second time in three days. He was not missing. He is not archived and
 * his stage groups to "In pipeline" correctly - he enquired on 22 April, and
 * the directory sorts newest enquiry first across 413 rows, so every family
 * from before this month sits below the fold.
 *
 * The default sort is right and stays: a daily operations list whose top row is
 * whoever comes first alphabetically answers a question nobody asked. What was
 * missing is any statement of what you are looking at. "Showing 413 of 413"
 * with no date range reads as "here is everyone", so an absent child reads as a
 * deleted record rather than a scroll.
 *
 * Source assertions - the fault was an absence, and the value asserted is a
 * sentence that was not on the screen.
 */

const root = join(__dirname, "..", "..", "..");
const table = readFileSync(
  join(root, "src/components/people/PeopleDirectoryTable.tsx"),
  "utf8"
);

describe("a lead that is simply old", () => {
  /** The classification was never the problem, and must not become one. */
  it("still counts as in the pipeline", () => {
    expect(groupForLead("shadow_day_completed")).toBe("pipeline");
  });

  it.each(["inquiry_received", "tour_scheduled", "application_started"])(
    "%s is in the pipeline too",
    (stage) => {
      expect(groupForLead(stage)).toBe("pipeline");
    }
  );
});

describe("the directory says how far back it runs", () => {
  it("computes an orientation line", () => {
    expect(table).toContain("orientation");
  });

  it("states the span rather than only a total", () => {
    expect(table).toContain("back to");
  });

  /** Only meaningful while the list is in date order. */
  it("shows it only when sorted by enquiry date", () => {
    expect(table).toContain('sortKey !== "inquired"');
  });
});

describe("the empty state names what hides a person", () => {
  it("says searching matches the guardian", () => {
    expect(table).toMatch(/guardian/i);
  });

  /**
   * Archived rows are hidden by default and that is the other way a real child
   * vanishes. An empty table that does not mention it invites a hard delete.
   */
  it("mentions archived records", () => {
    expect(table).toContain("Archived records are hidden");
  });
});
