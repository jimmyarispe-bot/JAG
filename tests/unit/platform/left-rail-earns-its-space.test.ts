import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * THE LEFT RAIL SHOWS THINGS YOU CANNOT ALREADY SEE.
 *
 * The workspace shell rendered a "Recent" list fed by an effect that tracked
 * the ACTIVE nav item. It could therefore only ever contain links already
 * sitting a few pixels above it in the same rail. On Admissions it rendered
 * "Today's Work, Highest Priorities, Awaiting My Review" - verbatim, the three
 * items in the nav directly overhead.
 *
 * In its place the rail carries a workspace's own footer slot, which is where
 * the parent inquiry link now lives: one address, permanently to hand, on the
 * screen staff have open all day.
 */

const root = join(__dirname, "..", "..", "..");
const shell = readFileSync(
  join(root, "src/components/experience-system/integration/ExperienceWorkspaceShell.tsx"),
  "utf8"
);
const page = readFileSync(
  join(root, "src/app/dashboard/admissions/AdmissionsPageContent.tsx"),
  "utf8"
);

describe("the workspace left rail", () => {
  it("no longer renders Recent", () => {
    expect(shell).not.toContain("<RecentItems");
  });

  /** A removed widget that leaves its hook behind still runs on every render. */
  it("does not keep tracking recents for a list nobody sees", () => {
    expect(shell).not.toContain("useRecentItems");
  });

  it("still carries favourites and the workspace footer", () => {
    expect(shell).toContain("<Favorites");
    expect(shell).toContain("{leftNavFooter}");
  });
});

describe("what the rail carries instead", () => {
  it("admissions puts the parent inquiry link there", () => {
    expect(page).toContain("leftNavFooter={<PublicInquiryLinkPanel");
  });
});
