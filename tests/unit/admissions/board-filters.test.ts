import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  NO_FILTERS,
  matchesQuery,
  UNASSIGNED,
  WAITING_BANDS,
  activeFilterCount,
  applyFilters,
  daysWaiting,
  deriveOptions,
  filtersFromParams,
  filtersToParams,
  matchesFilters,
  type BoardFilters,
  type BoardLead,
} from "@/lib/admissions/board-filters";

/**
 * Filtering a board of 289 families across four campuses.
 *
 * Asked for on 15 September 2026, for the pipeline board, which had none at all.
 * The People directory turned out to already have a full filter system that
 * nobody had found — a feature nobody can see costs the same as a feature
 * nobody built — so that half was a default and a label, and this half is real.
 *
 * The thing worth testing here is not "does filtering filter". It is the
 * handful of decisions that make a filter honest: options that cannot promise
 * an empty result, thresholds that do not bucket the longest waits out of view,
 * and a URL that survives being hand-edited.
 */

const NOW = Date.parse("2026-09-15T12:00:00Z");
const DAY = 86_400_000;

function lead(over: Partial<BoardLead> & { id: string }): BoardLead {
  return {
    school_id: "s1",
    first_name: "A",
    last_name: "Child",
    preferred_name: null,
    date_of_birth: null,
    current_grade: null,
    applying_for_grade: null,
    program: null,
    funding_sources: [],
    referral_source: null,
    inquiry_date: "2026-09-01",
    lead_stage: "new_inquiry",
    stage_entered_at: new Date(NOW).toISOString(),
    guardian_first_name: null,
    guardian_last_name: null,
    guardian_email: null,
    guardian_phone: null,
    notes: null,
    created_at: new Date(NOW).toISOString(),
    schools: null,
    ...over,
  } as BoardLead;
}

const FL = { name: "The Academy FL" };
const GA = { name: "The Academy GA" };

describe("options come out of the data, never a hardcoded list", () => {
  /**
   * THE ONE THAT MATTERS. A dropdown offering a campus with nobody in it — NJ,
   * closed since before this board existed — promises a result and returns an
   * empty screen.
   */
  it("offers only campuses that have somebody in them", () => {
    const options = deriveOptions([
      lead({ id: "1", schools: FL }),
      lead({ id: "2", schools: GA }),
      lead({ id: "3", schools: FL }),
    ]);
    expect(options.campuses).toEqual(["The Academy FL", "The Academy GA"]);
  });

  it("drops blank campuses and programmes rather than offering an empty option", () => {
    const options = deriveOptions([
      lead({ id: "1", schools: { name: "  " }, program: "" }),
      lead({ id: "2", schools: FL, program: "academy_ga_in_person" }),
    ]);
    expect(options.campuses).toEqual(["The Academy FL"]);
    expect(options.programs).toEqual(["academy_ga_in_person"]);
  });

  /**
   * Unassigned is only an answer when something is actually unassigned. If every
   * lead has an owner, the option is furniture implying a state that cannot occur.
   */
  it("flags Unassigned only when some lead really has no owner", () => {
    expect(deriveOptions([lead({ id: "1", assigned_to_user_id: "u1" })]).hasUnassigned).toBe(false);
    expect(deriveOptions([lead({ id: "1", assigned_to_user_id: null })]).hasUnassigned).toBe(true);
    expect(deriveOptions([lead({ id: "1", assigned_to_user_id: "   " })]).hasUnassigned).toBe(true);
  });

  it("sorts campuses and programmes so the list does not reshuffle between loads", () => {
    const options = deriveOptions([
      lead({ id: "1", schools: { name: "Zed" } }),
      lead({ id: "2", schools: { name: "Alpha" } }),
    ]);
    expect(options.campuses).toEqual(["Alpha", "Zed"]);
  });
});

describe("waiting is a threshold, not a bucket", () => {
  /**
   * THE ONE THAT MATTERS. "14+ days" must include the family who has waited
   * sixty. Bucketing is how the longest waits vanish from the view built to
   * find them.
   */
  it("includes longer waits in every shorter band", () => {
    const sixtyDays = lead({
      id: "1",
      stage_entered_at: new Date(NOW - 60 * DAY).toISOString(),
    });
    for (const band of WAITING_BANDS) {
      expect(
        matchesFilters(sixtyDays, { ...NO_FILTERS, waitingAtLeast: band.days }, NOW),
        band.label
      ).toBe(true);
    }
  });

  it("excludes a shorter wait from a longer band", () => {
    const threeDays = lead({
      id: "1",
      stage_entered_at: new Date(NOW - 3 * DAY).toISOString(),
    });
    expect(matchesFilters(threeDays, { ...NO_FILTERS, waitingAtLeast: 7 }, NOW)).toBe(false);
    expect(matchesFilters(threeDays, { ...NO_FILTERS, waitingAtLeast: 0 }, NOW)).toBe(true);
  });

  /** A lead that never moved stage has no stage_entered_at; created_at is the honest anchor. */
  it("falls back to created_at when the stage date is missing", () => {
    const l = lead({
      id: "1",
      stage_entered_at: null,
      created_at: new Date(NOW - 20 * DAY).toISOString(),
    });
    expect(daysWaiting(l, NOW)).toBe(20);
  });

  it("treats an unparseable date as no wait rather than NaN", () => {
    const l = lead({ id: "1", stage_entered_at: "not a date", created_at: "also not" });
    expect(daysWaiting(l, NOW)).toBe(0);
    // NaN comparisons are always false, which would silently hide the lead.
    expect(matchesFilters(l, { ...NO_FILTERS, waitingAtLeast: 0 }, NOW)).toBe(true);
  });
});

describe("the filters combine the way a person expects", () => {
  const leads: BoardLead[] = [
    lead({ id: "fl-new", schools: FL, program: "p1", assigned_to_user_id: "u1" }),
    lead({ id: "fl-old", schools: FL, program: "p2", assigned_to_user_id: null,
      stage_entered_at: new Date(NOW - 40 * DAY).toISOString() }),
    lead({ id: "ga-old", schools: GA, program: "p1", assigned_to_user_id: "u2",
      stage_entered_at: new Date(NOW - 40 * DAY).toISOString() }),
  ];

  it("ANDs every set filter", () => {
    const filters: BoardFilters = {
      campus: "The Academy FL",
      waitingAtLeast: 30,
      program: "p2",
      owner: UNASSIGNED,
    };
    expect(applyFilters(leads, filters, NOW).map((l) => l.id)).toEqual(["fl-old"]);
  });

  it("returns everything when nothing is set", () => {
    expect(applyFilters(leads, NO_FILTERS, NOW)).toHaveLength(3);
  });

  it("matches an owner by id, and Unassigned by absence", () => {
    expect(
      applyFilters(leads, { ...NO_FILTERS, owner: "u2" }, NOW).map((l) => l.id)
    ).toEqual(["ga-old"]);
    expect(
      applyFilters(leads, { ...NO_FILTERS, owner: UNASSIGNED }, NOW).map((l) => l.id)
    ).toEqual(["fl-old"]);
  });

  it("counts what is set, for the Clear button", () => {
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...NO_FILTERS, campus: "x", waitingAtLeast: 7 })).toBe(2);
    expect(activeFilterCount({ ...NO_FILTERS, waitingAtLeast: 0 })).toBe(0);
  });
});

describe("the URL survives the round trip, and survives being edited by hand", () => {
  it("writes only what is set, so an unfiltered board has a clean URL", () => {
    expect(filtersToParams(NO_FILTERS).toString()).toBe("");
    expect(filtersToParams({ ...NO_FILTERS, campus: "The Academy GA" }).toString()).toBe(
      "campus=The+Academy+GA"
    );
  });

  it("round trips every filter", () => {
    const filters: BoardFilters = {
      q: "oubre towa",
      campus: "The Academy HS",
      waitingAtLeast: 14,
      program: "academy_virtual",
      owner: "u9",
    };
    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters);
  });

  /**
   * THE ONE THAT MATTERS. ?waiting=banana parsed naively is NaN, and every
   * comparison against NaN is false — which empties the board and looks exactly
   * like "no families are waiting".
   */
  it("treats an unreadable ?waiting= as no filter rather than an empty board", () => {
    for (const bad of ["banana", "", "-5", "0", "NaN"]) {
      const params = new URLSearchParams({ waiting: bad });
      expect(filtersFromParams(params).waitingAtLeast, bad).toBe(0);
    }
  });

  it("reads a plain object as well as URLSearchParams", () => {
    expect(filtersFromParams({ campus: "The Academy FL", waiting: "30" })).toEqual({
      q: "",
      campus: "The Academy FL",
      program: "",
      owner: "",
      waitingAtLeast: 30,
    });
  });
});

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const code = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the board filters what it renders", () => {
  const board = code(read("src/components/admissions/AdmissionsPipelineBoard.tsx"));

  /**
   * The columns must read the FILTERED list. Rendering `leads` while the bar
   * reports a smaller number is a screen disagreeing with itself.
   */
  it("builds its columns from the filtered leads, not the raw ones", () => {
    expect(board).toContain("visibleLeads.filter(");
    expect(board).not.toMatch(/const stageLeads = leads\.filter\(/);
  });

  it("seeds the filters from the URL so a shared link arrives filtered", () => {
    expect(board).toContain("filtersFromParams");
  });

  it("tells the bar the real total and the real shown count", () => {
    expect(board).toMatch(/leads=\{allLeads\}/);
    expect(board).toMatch(/shownCount=\{visibleLeads\.length\}/);
  });
});

describe("the People filters are visible without being hunted for", () => {
  const table = read("src/components/people/PeopleDirectoryTable.tsx");

  /**
   * Every filter on that table already worked. The person who commissioned the
   * screen asked for filtering to be added to it, having never found the button.
   */
  it("opens the per-column filter row by default", () => {
    expect(code(table)).toMatch(/const \[showFilters, setShowFilters\] = useState\(true\)/);
  });

  it("labels the control with what clicking it does", () => {
    expect(table).toContain("Filter each column");
    expect(table).toContain("Hide filters");
  });
});

/**
 * THE JULIAN TEST.
 *
 * 15 September 2026. A School Leader on a live call could not find Julian Oubre
 * Towa. He was in JAG the entire time — a lead on The Academy Virtual, at
 * Shadow Days Scheduled, waiting since 25 August. It took a hand-written SQL
 * query with wildcards on both sides to locate him.
 *
 * Two things hid him, and this file only fixes one of them. There was no search
 * on the board at all; and his surname is stored as "Oubre Towa", two words in
 * one field, which defeats any search that matches from the start of a field or
 * requires the whole phrase to live in one column.
 *
 * Every case below is that child. If one of these ever goes red, a real family
 * has become invisible again.
 */
describe("finding a named child", () => {
  const julian = lead({
    id: "julian",
    first_name: "Julian",
    last_name: "Oubre Towa",
    lead_stage: "shadow_day_scheduled",
    guardian_email: "tara1n6@yahoo.com",
    guardian_first_name: "Tara",
    guardian_last_name: "Oubre",
  });

  const other = lead({
    id: "other",
    first_name: "Julian",
    last_name: "Wiley",
    guardian_email: "kaelinj85@gmail.com",
  });

  it("finds him by his first name", () => {
    expect(matchesQuery(julian, "julian")).toBe(true);
  });

  /** The one that mattered: the SECOND word of a two-word surname. */
  it("finds him by the second word of his surname", () => {
    expect(matchesQuery(julian, "towa")).toBe(true);
  });

  it("finds him by the first word of his surname", () => {
    expect(matchesQuery(julian, "oubre")).toBe(true);
  });

  /**
   * "julian towa" appears in no single field. Requiring one field to contain
   * the whole phrase is precisely the rule that lost him.
   */
  it("finds him from terms that live in different fields", () => {
    expect(matchesQuery(julian, "julian towa")).toBe(true);
    expect(matchesQuery(julian, "towa julian")).toBe(true);
  });

  it("does not care about case or stray spaces", () => {
    expect(matchesQuery(julian, "  JULIAN   Towa ")).toBe(true);
  });

  it("finds him by his mother's email", () => {
    expect(matchesQuery(julian, "tara1n6")).toBe(true);
  });

  it("finds him by his mother's name", () => {
    expect(matchesQuery(julian, "tara")).toBe(true);
  });

  /** Two Julians came back from the real query. The surname has to separate them. */
  it("tells the two Julians apart", () => {
    expect(matchesQuery(other, "julian")).toBe(true);
    expect(matchesQuery(other, "towa")).toBe(false);
    expect(matchesQuery(julian, "wiley")).toBe(false);
  });

  it("matches everybody when nothing is typed", () => {
    expect(matchesQuery(julian, "")).toBe(true);
    expect(matchesQuery(julian, "   ")).toBe(true);
  });

  it("finds nobody for a word that is in no row", () => {
    expect(matchesQuery(julian, "zzzqqx")).toBe(false);
  });

  it("searches through applyFilters, not only on its own", () => {
    const found = applyFilters([julian, other], { ...NO_FILTERS, q: "towa" }, NOW);
    expect(found.map((l) => l.id)).toEqual(["julian"]);
  });

  it("combines with the other filters rather than replacing them", () => {
    const withCampus = { ...NO_FILTERS, q: "julian", campus: "The Academy GA" };
    // Neither lead has a campus set, so the campus filter must still exclude both.
    expect(applyFilters([julian, other], withCampus, NOW)).toHaveLength(0);
  });

  it("counts as an active filter and survives the URL", () => {
    expect(activeFilterCount({ ...NO_FILTERS, q: "towa" })).toBe(1);
    expect(activeFilterCount({ ...NO_FILTERS, q: "   " })).toBe(0);
    expect(filtersToParams({ ...NO_FILTERS, q: "oubre towa" }).get("q")).toBe("oubre towa");
    expect(filtersFromParams(new URLSearchParams("q=towa")).q).toBe("towa");
  });
});
