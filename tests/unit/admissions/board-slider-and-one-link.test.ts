import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Two screens that said too much and moved too little.
 *
 * THE LINK PANEL listed every host mapped to the organization - five rows, one
 * of them the same domain twice, all serving the identical form. The intent was
 * honesty about what resolves; the effect was a wall of near-identical URLs and
 * no answer to "which one do I put on the website?".
 *
 * THE BOARD had two arrow buttons, one column per press. Thirteen stages is
 * four presses to reach the right-hand end, which is how a child in a late
 * stage stays unseen even after the scrollbar was fixed.
 *
 * Source assertions: both faults are about what is on the screen, and the
 * values asserted are the presence or absence of controls.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

const links = read("src/lib/admissions/public-form-links.ts");
const panel = read("src/components/admissions/PublicInquiryLinkPanel.tsx");
const page = read("src/app/dashboard/admissions/AdmissionsPageContent.tsx");
const scroller = read("src/components/admissions/BoardScroller.tsx");

describe("one address to publish", () => {
  it("drops duplicate hosts", () => {
    expect(links).toContain("new Set");
  });

  /**
   * A vanity domain resolves only if somebody pointed DNS at it, and an
   * unmapped host does not error - /apply renders a polite "not available for
   * this organization yet" and no form. The platform subdomain is served
   * directly, so it is the one that is safe to hand to a parent.
   */
  it("ranks the organization's own platform door first", () => {
    expect(links).toContain('.endsWith(".thejag.org")');
    expect(links).toContain("isBarePlatform");
  });

  it("no longer renders a list of alternates", () => {
    expect(panel).not.toContain("alternates");
  });
});

describe("the link panel lives in the left rail", () => {
  it("is passed to the shell rather than the main column", () => {
    expect(page).toContain("leftNavFooter={<PublicInquiryLinkPanel");
  });

  it("the scope bar is gone from above the work", () => {
    expect(page).not.toContain("JagOrganizationContextBar");
  });
});

describe("the board can be dragged end to end", () => {
  it("has a slider, not only arrows", () => {
    expect(scroller).toContain('type="range"');
  });

  it("the slider drives the board's scroll position", () => {
    expect(scroller).toContain("slideTo");
    expect(scroller).toContain("node.scrollLeft = value");
  });

  /** A thumb you have to aim at is a thumb nobody drags. */
  it("gives the thumb a grabbable size", () => {
    expect(scroller).toContain("::-webkit-slider-thumb");
    expect(scroller).toContain("::-moz-range-thumb");
  });

  /** Still hidden when everything fits — furniture implying a feature. */
  it("is drawn only when the board overflows", () => {
    expect(scroller).toContain("{scrollable && (");
  });
});
