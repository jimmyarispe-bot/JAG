/**
 * How many months a campus's school year has, and how many are left.
 *
 * WHY THIS EXISTS. `buildPlan` prorates as `annual x monthsAttending /
 * monthsInYear` and is exactly right about it. But it does not work out
 * `monthsInYear` — it is handed one. Both callers hand it the literal 12:
 *
 *   plan-editor-actions.ts   { monthsAttending: ..., monthsInYear: 12 }
 *   TuitionPlanBuilder.tsx   { monthsAttending: ..., monthsInYear: 12 }
 *
 * Twelve is right for The Academy FL and The Academy GA, whose year runs
 * 1 June to 31 May. It is wrong for The Academy Virtual and The Academy HS,
 * which run 1 August to 31 May — ten months. A Virtual student attending eight
 * months is billed 8/12 of $15,000, which is $10,000, when the answer is 8/10,
 * which is $12,000. The arithmetic is perfect and the answer is two thousand
 * dollars short, because the input was wrong.
 *
 * Jimmy, 27 September 2026: "monthly rate is the annual fee divided by the
 * months in that campus's year".
 *
 * So the month count is derived here from the campus's own school year dates -
 * corrected across all four campuses in migration 444 - and never typed by a
 * caller who may not know which campus they are looking at.
 *
 * DATES ARE PARSED AS TEXT, NOT AS `Date`. `new Date("2026-08-01")` is midnight
 * UTC, and west of Greenwich that is 31 July — which silently costs a month.
 * Month arithmetic needs the year and the month and nothing else, so this reads
 * them off the string and never builds a Date at all.
 *
 * EVERY FAILURE IS A REFUSAL. A missing school year, a malformed date, a
 * student starting after the year ends: each throws and names the figure that
 * is wrong. None of them returns a number. A plausible number produced from a
 * bad input is the failure this module exists to prevent.
 */

/** A calendar month, as a count of months since year 0. Comparable and subtractable. */
function monthIndex(iso: string, label: string): number {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso.trim());
  if (!m) {
    throw new Error(
      `${label} is not a date in YYYY-MM-DD form: ${JSON.stringify(iso)}.`
    );
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) {
    throw new Error(`${label} has month ${month}, which is not a month: ${iso}.`);
  }
  return year * 12 + (month - 1);
}

export interface SchoolYearBounds {
  /** First day of the school year, YYYY-MM-DD. */
  readonly startDate: string;
  /** Last day of the school year, YYYY-MM-DD. */
  readonly endDate: string;
}

/**
 * Months in the school year, counting the first and last month inclusive.
 *
 *   1 Jun 2026 - 31 May 2027  ->  12   (FL, GA)
 *   1 Aug 2026 - 31 May 2027  ->  10   (Virtual, HS)
 */
export function monthsInSchoolYear(year: SchoolYearBounds): number {
  const first = monthIndex(year.startDate, "School year start");
  const last = monthIndex(year.endDate, "School year end");
  if (last < first) {
    throw new Error(
      `School year ends before it starts: ${year.startDate} to ${year.endDate}.`
    );
  }
  return last - first + 1;
}

/**
 * Months the student will attend, counting from the month they start through
 * the last month of the year.
 *
 * A start date BEFORE the year opens is treated as the year opening: a family
 * who says "we'll start in July" at a campus whose year begins in August
 * attends ten months, not eleven. They cannot attend a month the year does not
 * have. For Virtual and HS, June and July are separately billable months
 * outside the contracted year and are not part of this figure.
 *
 * A start date AFTER the year closes throws. There is no honest number for it,
 * and returning zero would produce a plan for nothing at all.
 */
export function monthsRemainingInSchoolYear(
  year: SchoolYearBounds,
  studentStartDate: string
): number {
  const first = monthIndex(year.startDate, "School year start");
  const last = monthIndex(year.endDate, "School year end");
  const start = monthIndex(studentStartDate, "Student start date");

  if (last < first) {
    throw new Error(
      `School year ends before it starts: ${year.startDate} to ${year.endDate}.`
    );
  }
  if (start > last) {
    throw new Error(
      `Student starts ${studentStartDate}, after the school year ends ${year.endDate}. ` +
        `Pick the next school year rather than prorating this one to nothing.`
    );
  }

  const effective = start < first ? first : start;
  return last - effective + 1;
}

export interface Proration {
  readonly monthsAttending: number;
  readonly monthsInYear: number;
  /** True when the student is there for the whole year and nothing should be prorated. */
  readonly isFullYear: boolean;
}

/**
 * The pair `buildPlan` wants, derived rather than typed.
 *
 * `isFullYear` is separate from `monthsAttending === monthsInYear` on purpose:
 * the caller needs to decide whether to pass a proration at all, and
 * "prorated to the whole year" and "not prorated" should not be two names for
 * one thing on a family's document.
 */
export function prorationForStudent(
  year: SchoolYearBounds,
  studentStartDate: string
): Proration {
  const monthsInYear = monthsInSchoolYear(year);
  const monthsAttending = monthsRemainingInSchoolYear(year, studentStartDate);
  return {
    monthsAttending,
    monthsInYear,
    isFullYear: monthsAttending >= monthsInYear,
  };
}
