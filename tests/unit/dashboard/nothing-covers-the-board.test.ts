/**
 * NOTHING COVERS THE BOARD.
 *
 * Jimmy, 16 October 2026:
 *
 *   "when users are logging into the jag, specifically danni, heather, nina,
 *    they should not see that smaller window popup asking with all the
 *    different card options on it. the first things they should always see is
 *    their own schools current pipeline screen"
 *
 * ── THE FAULT WAS TWO CORRECT FEATURES DISAGREEING ──────────────────────────
 *
 * The redirect was never broken. landsOnAdmissionsBoard has sent those three
 * to the pipeline since 10 October, when Jimmy asked why Nina was seeing Home.
 * GuideChooser then opened ON TOP of it - a dialog of area cards, mounted in
 * the dashboard layout, greeting every person on arrival. So the redirect
 * worked and the first thing they saw was still a menu.
 *
 * Neither piece was wrong on its own, which is why neither piece's tests
 * caught it. The seam is always where it breaks.
 *
 * ── WHY THE DISMISS BUTTON WAS NOT THE ANSWER ───────────────────────────────
 *
 * GuideProvider keeps `dismissed` in localStorage, keyed per user AND PER
 * DEVICE - its own header says so. Pressing "I can find my way around JAG" on
 * a laptop is greeted again on a phone, and again on a new machine. A
 * per-device opt-out cannot answer "they should not see it".
 *
 * ── ONE RULE, NOT TWO LISTS ─────────────────────────────────────────────────
 *
 * The layout reads landsOnAdmissionsBoard - the same function the redirect
 * uses - rather than naming roles a second time. landing.ts's own header warns
 * about exactly that: "The same question answered in three places is how every
 * workspace in the network ended up titled The Academy FL."
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { landsOnAdmissionsBoard } from "@/lib/dashboard/landing";

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
/** Assert on code, not on the comments that describe it. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const layout = code(read("src/app/dashboard/layout.tsx"));
const provider = code(read("src/components/guides/GuideProvider.tsx"));

const ctx = (...roles: string[]) => ({ roles }) as never;

describe("the three who run admissions are not greeted", () => {
  it.each([
    ["Nina and Heather", "SCHOOL_LEADER"],
    ["Danni", "EXECUTIVE_DIRECTOR"],
    ["Mahogany", "VIRTUAL_COORDINATOR"],
  ])("%s lands on the board, so the chooser must not greet", (_who, role) => {
    expect(landsOnAdmissionsBoard(ctx(role))).toBe(true);
  });

  it("the founder is still greeted, and still lands on the founder dashboard", () => {
    /* FOUNDER is excluded from the board redirect on purpose - "the founder
       dashboard leads with the numbers, on purpose, and that is a different
       job". So nothing is being taken off Jimmy's screen here. */
    expect(landsOnAdmissionsBoard(ctx("FOUNDER"))).toBe(false);
  });

  it("a founder who also holds SCHOOL_LEADER is still not redirected", () => {
    expect(landsOnAdmissionsBoard(ctx("FOUNDER", "SCHOOL_LEADER"))).toBe(false);
  });
});

describe("the layout wires it, which is the half that was missing before", () => {
  /*
   * guides-mounted.test.ts exists because this feature once shipped complete
   * and unmounted: provider, chooser, panel, 50 walkthroughs, 84 passing tests
   * and no line in the layout rendering any of it. This is the same assertion
   * for the same reason - the switch is worth nothing unless it is passed.
   */
  it("passes greetOnArrival to the provider", () => {
    expect(layout).toContain("greetOnArrival={!landsOnAdmissionsBoard(ctx)}");
  });

  it("reads the redirect's own function rather than a second list of roles", () => {
    expect(layout).toContain('from "@/lib/dashboard/landing"');
    /* If somebody ever writes the role names here instead, this fails and they
       have to go and read landing.ts, which is the point. */
    expect(layout).not.toContain('"SCHOOL_LEADER"');
    expect(layout).not.toContain('"EXECUTIVE_DIRECTOR"');
  });

  it("the provider actually gates the greeting on it", () => {
    expect(provider).toContain("greetOnArrival && !stored.dismissed");
  });

  it("still greets by default, so nothing else changes", () => {
    /* Everyone not landing on a board is unaffected: the prop defaults true. */
    expect(provider).toContain("greetOnArrival = true");
  });
});
