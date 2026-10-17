import { describe, it, expect } from "vitest";

import type { OutOfOfficeBlock } from "@/lib/admissions/chase/calendar";
import {
  ACTS_ON_CHILDREN_NEWER_THAN_DAYS,
  WORKING_DAY_END_HOUR,
  WORKING_DAY_START_HOUR,
  absencesFromBlocks,
  absencesOn,
  blockCoversWorkingDay,
  formatAbsenceDates,
  formatFamilyLines,
} from "@/lib/admissions/chase/out-of-office";

/**
 * Jimmy, 16 October 2026, on what counts:
 *
 *   "a block on her own calendar that Google marks Out of office, covering
 *    her whole working day Eastern - 8am to 5pm - on a weekday. Not a lunch
 *    break, not a two-hour gap, not a Saturday. A half day doesn't count.
 *    If she blocks Monday and Tuesday that is two days, but it's still one
 *    absence."
 *
 * Every test below is one clause of that sentence.
 */

const HEATHER = "heather.brown@theacademyway.org";

function allDay(start: string, end: string | null): OutOfOfficeBlock {
  return {
    calendarId: HEATHER,
    eventId: `ooo-${start}`,
    summary: "Out of office",
    startsAt: start,
    endsAt: end,
    allDay: true,
  };
}

function timed(startsAt: string, endsAt: string): OutOfOfficeBlock {
  return {
    calendarId: HEATHER,
    eventId: `ooo-${startsAt}`,
    summary: "Out of office",
    startsAt,
    endsAt,
    allDay: false,
  };
}

/* -------------------------------------------------------------------------- */
/* One day, and what Google means by it                                        */
/* -------------------------------------------------------------------------- */

describe("an all-day out-of-office block", () => {
  /*
   * GOOGLE'S END DATE IS EXCLUSIVE. A single day off on Monday the 19th
   * arrives as start 2026-10-19, end 2026-10-20. Reading that end as
   * inclusive would mark her out on the Tuesday she came back, and the first
   * thing anybody would notice is a family written to a day late for a reason
   * nobody could find.
   */
  it("covers the day it starts on", () => {
    expect(blockCoversWorkingDay(allDay("2026-10-19", "2026-10-20"), "2026-10-19")).toBe(
      true
    );
  });

  it("does NOT cover the exclusive end date — she is back that day", () => {
    expect(blockCoversWorkingDay(allDay("2026-10-19", "2026-10-20"), "2026-10-20")).toBe(
      false
    );
  });

  it("covers every day of a longer block", () => {
    const block = allDay("2026-10-19", "2026-10-24"); // Mon to Fri inclusive
    for (const day of ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"]) {
      expect(blockCoversWorkingDay(block, day)).toBe(true);
    }
    expect(blockCoversWorkingDay(block, "2026-10-24")).toBe(false);
  });

  it("treats a block with no end at all as the single day it starts on", () => {
    expect(blockCoversWorkingDay(allDay("2026-10-19", null), "2026-10-19")).toBe(true);
    expect(blockCoversWorkingDay(allDay("2026-10-19", null), "2026-10-20")).toBe(false);
  });

  it("never counts a Saturday or a Sunday", () => {
    const block = allDay("2026-10-17", "2026-10-19"); // Sat and Sun
    expect(blockCoversWorkingDay(block, "2026-10-17")).toBe(false);
    expect(blockCoversWorkingDay(block, "2026-10-18")).toBe(false);
  });
});

describe("a timed out-of-office block", () => {
  /*
   * "A half day doesn't count." A leader back after lunch can press her own
   * buttons, and a platform that acted in her place because she had a dentist
   * appointment at ten would be acting on nothing.
   */
  it("does not count a morning out", () => {
    expect(
      blockCoversWorkingDay(
        timed("2026-10-19T09:00:00-04:00", "2026-10-19T12:00:00-04:00"),
        "2026-10-19"
      )
    ).toBe(false);
  });

  it("does not count an afternoon out", () => {
    expect(
      blockCoversWorkingDay(
        timed("2026-10-19T13:00:00-04:00", "2026-10-19T17:30:00-04:00"),
        "2026-10-19"
      )
    ).toBe(false);
  });

  it("counts a block that spans the whole working day exactly", () => {
    expect(
      blockCoversWorkingDay(
        timed("2026-10-19T08:00:00-04:00", "2026-10-19T17:00:00-04:00"),
        "2026-10-19"
      )
    ).toBe(true);
  });

  it("counts a block wider than the working day", () => {
    expect(
      blockCoversWorkingDay(
        timed("2026-10-19T06:30:00-04:00", "2026-10-19T20:00:00-04:00"),
        "2026-10-19"
      )
    ).toBe(true);
  });

  /*
   * The offset is Google's, not ours. A block written in Pacific time that
   * still covers 8am-5pm Eastern is still a day out; one that starts at 8am
   * Pacific is 11am Eastern and is not.
   */
  it("reads the offset Google supplied rather than assuming Eastern", () => {
    expect(
      blockCoversWorkingDay(
        timed("2026-10-19T08:00:00-07:00", "2026-10-19T17:00:00-07:00"),
        "2026-10-19"
      )
    ).toBe(false);
  });

  it("uses the working day the constants declare", () => {
    expect(WORKING_DAY_START_HOUR).toBe(8);
    expect(WORKING_DAY_END_HOUR).toBe(17);
  });
});

/* -------------------------------------------------------------------------- */
/* One absence, however many days it is                                        */
/* -------------------------------------------------------------------------- */

describe("absences", () => {
  const now = new Date("2026-10-21T03:00:00Z"); // 11pm Eastern, Tuesday 20th

  it("makes Monday to Friday ONE absence of five days", () => {
    const [absence, ...rest] = absencesFromBlocks([allDay("2026-10-19", "2026-10-24")], {
      now,
    });
    expect(rest).toHaveLength(0);
    expect(absence.dateKeys).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
    ]);
    expect(absence.startedOn).toBe("2026-10-19");
  });

  /*
   * A Friday and the Monday after are ONE absence, because no working day
   * sits between them. Two rows in the sends table for that week would mean
   * a child written to twice for one holiday.
   */
  it("joins a Friday and the following Monday across the weekend", () => {
    const absences = absencesFromBlocks(
      [allDay("2026-10-16", "2026-10-17"), allDay("2026-10-19", "2026-10-20")],
      { now }
    );
    expect(absences).toHaveLength(1);
    expect(absences[0].dateKeys).toEqual(["2026-10-16", "2026-10-19"]);
    expect(absences[0].startedOn).toBe("2026-10-16");
  });

  it("keeps a Monday and a Wednesday as two separate absences", () => {
    const absences = absencesFromBlocks(
      [allDay("2026-10-19", "2026-10-20"), allDay("2026-10-21", "2026-10-22")],
      { now }
    );
    expect(absences).toHaveLength(2);
    expect(absences.map((a) => a.startedOn)).toEqual(["2026-10-19", "2026-10-21"]);
  });

  it("keeps two leaders apart", () => {
    const nina: OutOfOfficeBlock = {
      ...allDay("2026-10-19", "2026-10-20"),
      calendarId: "nina.gaddy@theacademyga.org",
    };
    const absences = absencesFromBlocks([allDay("2026-10-19", "2026-10-20"), nina], {
      now,
    });
    expect(absences).toHaveLength(2);
    expect(new Set(absences.map((a) => a.calendarId))).toEqual(
      new Set([HEATHER, "nina.gaddy@theacademyga.org"])
    );
  });

  it("finds nobody when nobody is out", () => {
    expect(absencesFromBlocks([], { now })).toEqual([]);
    expect(absencesOn([], "2026-10-20").size).toBe(0);
  });

  it("names the leader out on a given day, and only that day", () => {
    const absences = absencesFromBlocks([allDay("2026-10-19", "2026-10-21")], { now });
    expect(absencesOn(absences, "2026-10-20").has(HEATHER)).toBe(true);
    expect(absencesOn(absences, "2026-10-21").has(HEATHER)).toBe(false);
  });

  /*
   * THE DAY NUMBER IS WHAT THE SCAN REPORT PRINTS, and it comes from the
   * absence rather than from a count of rows. "day 3 of 5" tells whoever
   * reads a run that she is mid-holiday; "day 1 of 5" on the Wednesday would
   * mean the run grouping had broken.
   */
  it("knows which day of the absence today is", () => {
    const absences = absencesFromBlocks([allDay("2026-10-19", "2026-10-24")], { now });
    expect(absences[0].dateKeys.indexOf("2026-10-21") + 1).toBe(3);
    expect(absences[0].dateKeys).toHaveLength(5);
  });
});

/* -------------------------------------------------------------------------- */
/* The guard that exists because of 26 August                                  */
/* -------------------------------------------------------------------------- */

describe("the backlog guard", () => {
  /*
   * On the day this was built, Virtual held eighteen children at Interest
   * Meeting Held whose last movement was 26 August, and eighteen more at New
   * Inquiry. Without a window, one day of Heather's absence would have
   * written to all of them.
   *
   * This asserts the number rather than the behaviour because the behaviour
   * needs a database. If somebody widens it, this test is where they have to
   * say so out loud.
   */
  it("acts only on children who arrived in the last fortnight", () => {
    expect(ACTS_ON_CHILDREN_NEWER_THAN_DAYS).toBe(14);
  });
});

/* -------------------------------------------------------------------------- */
/* "While you were out" — the words Jimmy approved on 16 October               */
/* -------------------------------------------------------------------------- */

describe("the while-you-were-out letter", () => {
  /*
   * He cut the subject himself: "only while you were out in subject". The
   * draft had carried a count. Asserted in migration 564's guard as well as
   * here, because a subject line is the one part of a letter that cannot be
   * fixed after it has landed in somebody's inbox.
   */
  it("names one day on its own", () => {
    expect(formatAbsenceDates(["2026-10-19"])).toBe("Monday 19 October");
  });

  it("names the first and last day of a longer absence, not every day", () => {
    expect(
      formatAbsenceDates(["2026-10-19", "2026-10-20", "2026-10-21"])
    ).toBe("Monday 19 October to Wednesday 21 October");
  });

  it("spans a weekend without naming the Saturday", () => {
    expect(formatAbsenceDates(["2026-10-16", "2026-10-19"])).toBe(
      "Friday 16 October to Monday 19 October"
    );
  });

  it("says nothing for no days at all", () => {
    expect(formatAbsenceDates([])).toBe("");
  });

  /*
   * "renders one line per child - name, grade, parent name, parent phone -
   * same four facts the inquiry alert gives you."
   */
  it("gives one line per child, four facts, the child's name first", () => {
    expect(
      formatFamilyLines([
        {
          childName: "Nora Whitfield",
          grade: "4th grade",
          guardianName: "Kelly Whitfield",
          guardianPhone: "(470) 555-0163",
        },
      ])
    ).toBe("Nora Whitfield &middot; 4th grade &middot; Kelly Whitfield &middot; (470) 555-0163");
  });

  it("puts each child on their own line", () => {
    const rendered = formatFamilyLines([
      { childName: "Nora Whitfield", grade: "4th grade", guardianName: "Kelly Whitfield", guardianPhone: "(470) 555-0163" },
      { childName: "Desmond Agu", grade: "7th grade", guardianName: "Ifeoma Agu", guardianPhone: "(678) 555-0111" },
    ]);
    expect(rendered.split("<br>")).toHaveLength(2);
    expect(rendered).toContain("Desmond Agu");
  });

  /*
   * A FACT WE DO NOT HAVE IS LEFT OUT, NOT PRINTED EMPTY. A child with no
   * grade on the inquiry must not render "Nora Whitfield &middot;  &middot;
   * Kelly Whitfield", which reads as a bug to the person holding the phone.
   */
  it("drops a fact it does not have rather than leaving a gap", () => {
    expect(
      formatFamilyLines([
        { childName: "Leonardo Rogio", grade: null, guardianName: "Ana Rogio", guardianPhone: null },
      ])
    ).toBe("Leonardo Rogio &middot; Ana Rogio");
  });
});
