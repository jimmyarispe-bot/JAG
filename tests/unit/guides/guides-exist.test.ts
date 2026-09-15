import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_GUIDES,
  GUIDE_AREAS,
  allGuideHrefs,
  areaOfGuide,
  guideById,
  searchGuides,
} from "@/lib/guides/catalog";
import { DASHBOARD_MODULES } from "@/lib/dashboard/navigation";

/**
 * A guide that sends somebody to a 404 is worse than no guide.
 *
 * It costs them the trust to try the next one — and these are for the people
 * who are least sure of the system, which is the whole reason the feature
 * exists. So every href is checked against the filesystem rather than against
 * my memory of what the routes were.
 *
 * This is the test that has to keep working. Routes move; a guide silently
 * pointing at where a page used to be is exactly the class of quiet wrong this
 * codebase keeps producing.
 */

const root = join(__dirname, "..", "..", "..");

/** Does a route exist under src/app? Handles [id] segments and query strings. */
function routeExists(href: string): boolean {
  const path = href.split("?")[0].replace(/^\/+|\/+$/g, "");
  const segments = path ? path.split("/") : [];

  let dir = join(root, "src", "app");
  for (const segment of segments) {
    const direct = join(dir, segment);
    if (existsSync(direct)) {
      dir = direct;
      continue;
    }
    // A dynamic segment — /dashboard/students/[id] — matches any value.
    const dynamic = ["[id]", "[slug]"].map((d) => join(dir, d)).find((p) => existsSync(p));
    if (dynamic) {
      dir = dynamic;
      continue;
    }
    return false;
  }
  return existsSync(join(dir, "page.tsx"));
}

describe("every link in every guide goes somewhere real", () => {
  /** THE ONE THAT MATTERS. */
  it.each(allGuideHrefs())("%s resolves to a page", (href) => {
    expect(routeExists(href), `${href} has no page.tsx under src/app`).toBe(true);
  });

  /** Proves the check above can actually fail, rather than returning true for anything. */
  it("rejects a route that does not exist", () => {
    expect(routeExists("/dashboard/definitely-not-a-page")).toBe(false);
    expect(routeExists("/dashboard/admissions/nope")).toBe(false);
  });

  it("accepts a query string on a real page", () => {
    expect(routeExists("/dashboard/admissions?view=pipeline")).toBe(true);
  });
});

describe("the catalog is well formed", () => {
  it("has no duplicate guide ids", () => {
    const ids = ALL_GUIDES.map((g) => g.id);
    expect(new Set(ids).size, ids.join(", ")).toBe(ids.length);
  });

  it("has no duplicate area ids", () => {
    const ids = GUIDE_AREAS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every area at least one guide", () => {
    for (const area of GUIDE_AREAS) {
      expect(area.guides.length, area.id).toBeGreaterThan(0);
    }
  });

  /**
   * A one-step guide is a link with extra ceremony. If something genuinely
   * takes one step, it belongs in the sidebar, not here.
   */
  it("gives every guide at least two steps", () => {
    for (const guide of ALL_GUIDES) {
      expect(guide.steps.length, guide.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("gives every guide a first step that goes somewhere", () => {
    for (const guide of ALL_GUIDES) {
      expect(guide.steps[0].href, `${guide.id} — the first step must open a page`).toBeTruthy();
    }
  });

  it("writes every step title as something to do", () => {
    for (const guide of ALL_GUIDES) {
      for (const step of guide.steps) {
        expect(step.title.length, `${guide.id}: "${step.title}"`).toBeGreaterThan(3);
        // No trailing full stop on a title — it is a label, not a sentence.
        expect(step.title.endsWith("."), `${guide.id}: "${step.title}"`).toBe(false);
      }
    }
  });

  it("finds a guide and its area by id", () => {
    const first = ALL_GUIDES[0];
    expect(guideById(first.id)).toEqual(first);
    expect(areaOfGuide(first.id)?.guides).toContain(first);
    expect(guideById("nope")).toBeNull();
    expect(areaOfGuide("nope")).toBeNull();
  });
});

/**
 * "Make sure every possible path is illustrated in this."
 *
 * The catalog is now the sidebar, and this is the test that keeps it that way.
 * A module that ships without a walkthrough is not a gap somebody notices —
 * it is a person clicking the thing that is meant to help them, not finding
 * their job in the list, and never opening it again.
 */
describe("every module a person can open has a walkthrough", () => {
  const hrefs = allGuideHrefs();

  /** Does any guide step land inside this module? */
  function covered(moduleHref: string): boolean {
    return hrefs.some((h) => h.split("?")[0] === moduleHref || h.startsWith(`${moduleHref}/`));
  }

  const modules = DASHBOARD_MODULES.map((m) => m.href)
    // "/dashboard" is the landing page they are already looking at, and it
    // would match every href under it — covering it proves nothing.
    .filter((h) => h !== "/dashboard");

  it.each(modules)("%s is reachable from a guide", (href) => {
    expect(covered(href), `no walkthrough step opens ${href}`).toBe(true);
  });

  /** Proves the check can fail rather than saying yes to anything. */
  it("does not claim to cover a module nobody wrote a guide for", () => {
    expect(covered("/dashboard/not-a-module")).toBe(false);
  });

  /** The three that are not in DASHBOARD_MODULES but are in the sidebar. */
  it.each(["/dashboard/people", "/dashboard/executive", "/dashboard/admin"])(
    "%s is reachable from a guide",
    (href) => {
      expect(covered(href), `no walkthrough step opens ${href}`).toBe(true);
    }
  );
});

/**
 * The search box.
 *
 * It exists because two clicks only helps somebody who already knows which
 * door their task is behind, and the people this feature is for are precisely
 * the ones who do not.
 */
describe("searching the walkthroughs", () => {
  it("finds nothing for an empty query rather than everything", () => {
    expect(searchGuides("")).toEqual([]);
    expect(searchGuides("   ")).toEqual([]);
  });

  it("matches a walkthrough title", () => {
    const hits = searchGuides("shadow day");
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(ALL_GUIDES).toContain(hit.guide);
    }
  });

  it("ignores case and surrounding spaces", () => {
    expect(searchGuides("  ATTENDANCE  ").map((h) => h.guide.id)).toEqual(
      searchGuides("attendance").map((h) => h.guide.id)
    );
  });

  /**
   * The point of searching step text: somebody types the thing they are stuck
   * on, which is a step, and the walkthrough that fixes it is called something
   * else entirely.
   */
  it("matches words that only appear inside a step", () => {
    const step = ALL_GUIDES.flatMap((g) =>
      g.steps.filter((s) => s.detail).map((s) => ({ g, s }))
    )[0];
    const word = step.s.detail!.split(" ").find((w) => w.length > 6)!;
    expect(searchGuides(word).map((h) => h.guide.id)).toContain(step.g.id);
  });

  it("returns the area each answer came from", () => {
    for (const hit of searchGuides("a")) {
      expect(hit.area.guides).toContain(hit.guide);
    }
  });

  it("returns nothing for a word that is in no walkthrough", () => {
    expect(searchGuides("zzzqqx")).toEqual([]);
  });
});
