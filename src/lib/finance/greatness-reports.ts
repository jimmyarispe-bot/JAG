/**
 * GREATNESS Reports on the weekly pay sheet.
 *
 * Jimmy, 25 September 2026:
 *
 *   "once for each week, we need a drop down with numbers 0-50 that teachers
 *    can indicate 'How many GREATNESS Reports did you complete this week?' The
 *    number they select should match the greatest quantity or be less than the
 *    number of students they taught during one week. if it is greater than this
 *    number then jag doesn't let them submit it and tells them why. then the
 *    number of greatness reports is paid @ $5 per report. only 1 per child per
 *    month is the limit."
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE WEEKLY CAP CANNOT ENFORCE THE MONTHLY LIMIT ON ITS OWN.
 *
 * "no more than the children you taught this week" is a weekly test, and the
 * rule is monthly. A teacher with ten children passes that test four weeks
 * running and has claimed forty reports for ten children. Every week legal,
 * the month four times over.
 *
 * So the cap is the weekly ceiling MINUS what she has already claimed in the
 * same calendar month. Week one she may claim all ten; week two the ceiling is
 * zero. One number on screen, the monthly rule actually held.
 *
 * Decided with Jimmy, 25 September, over two alternatives: a weekly-only cap
 * (simple, unenforced) and picking children by name (exact, but a list of
 * checkboxes every week instead of one dropdown).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHICH MONTH A WEEK BELONGS TO.
 *
 * The Monday. A week that straddles two months has to belong to one of them or
 * the allowance can be spent twice, and the Monday is the date the sheet is
 * already keyed on - week_start - so there is nothing new to agree or store.
 *
 * DECEMBER AND MAY ARE EXCLUDED, because the rate says so: greatness_report is
 * "monthly except Dec & May", those being the parent-conference months. The
 * cadence was written against the rate in September and enforced by nothing;
 * here it is enforced.
 *
 * A CHILD IN THREE OF HER CLASSES IS ONE CHILD. A report is about a child, so
 * the ceiling counts distinct children, not roster seats.
 *
 * Pure. No database, no clock, no request. Everything here is a decision that
 * should be readable and testable without standing up a session.
 */

/** The stable machine name in work_pay_rates. Never key off the label. */
export const GREATNESS_WORK_CODE = "greatness_report";

/** The top of the dropdown. Jimmy's number. */
export const GREATNESS_DROPDOWN_MAX = 50;

/** Parent conferences happen instead. Months are 1-based. */
const MONTHS_WITHOUT_GREATNESS_REPORTS = new Set([5, 12]);

/** The calendar month a pay week belongs to, as "YYYY-MM". */
export function greatnessMonthOf(weekStart: string): string {
  return weekStart.slice(0, 7);
}

/**
 * Does the question appear at all this week?
 *
 * False in May and December. The dropdown is not shown, nothing is claimable,
 * and a claim that somehow arrives is refused - a hidden field is a UI
 * convenience, not a rule.
 */
export function greatnessAppliesTo(weekStart: string): boolean {
  const month = Number(weekStart.slice(5, 7));
  return !MONTHS_WITHOUT_GREATNESS_REPORTS.has(month);
}

export interface GreatnessCapInput {
  readonly weekStart: string;
  /** Distinct children she taught in held classes this week. Not roster seats. */
  readonly distinctChildrenThisWeek: number;
  /**
   * Reports already claimed in this calendar month on OTHER weeks.
   *
   * Her own week is excluded by the caller. Including it would mean saving 4
   * this week dropped her ceiling to 6, and saving again dropped it to 2 - a
   * field that eats itself every time it is touched.
   */
  readonly claimedElsewhereThisMonth: number;
}

/**
 * The largest number she may choose this week.
 *
 * Never negative: a month already over its allowance - possible from a
 * correction, or from data predating this rule - reads zero rather than a
 * minus, because a negative ceiling is not a thing a person can act on.
 */
export function greatnessMaxFor(input: GreatnessCapInput): number {
  if (!greatnessAppliesTo(input.weekStart)) return 0;
  const remainingThisMonth =
    input.distinctChildrenThisWeek - input.claimedElsewhereThisMonth;
  return Math.max(0, Math.min(GREATNESS_DROPDOWN_MAX, remainingThisMonth));
}

export type GreatnessRefusal = { readonly ok: false; readonly reason: string };
export type GreatnessAcceptance = { readonly ok: true };
export type GreatnessCheck = GreatnessAcceptance | GreatnessRefusal;

/**
 * May she claim this many?
 *
 * THE REFUSAL SAYS THE NUMBERS. "Invalid" tells a teacher she is wrong and
 * nothing else; she then either guesses or writes to Jimmy. Every message here
 * names what she chose, what the ceiling is, and which of the two rules
 * produced it, so she can fix it herself in one go.
 */
export function checkGreatnessClaim(
  input: GreatnessCapInput & { readonly claimed: number }
): GreatnessCheck {
  const { claimed, weekStart, distinctChildrenThisWeek, claimedElsewhereThisMonth } = input;

  if (!Number.isInteger(claimed) || claimed < 0) {
    return { ok: false, reason: "Choose a whole number of GREATNESS Reports, zero or more." };
  }

  if (claimed === 0) return { ok: true };

  if (!greatnessAppliesTo(weekStart)) {
    const month = new Date(`${weekStart}T12:00:00Z`).toLocaleString("en-US", {
      month: "long",
      timeZone: "UTC",
    });
    return {
      ok: false,
      reason:
        `GREATNESS Reports are not claimed in ${month} - parent conferences happen ` +
        `instead. Set it to 0 to submit this week.`,
    };
  }

  if (claimed > GREATNESS_DROPDOWN_MAX) {
    return {
      ok: false,
      reason: `${claimed} is more than ${GREATNESS_DROPDOWN_MAX}, which is the most that can be claimed in one week.`,
    };
  }

  if (claimed > distinctChildrenThisWeek) {
    return {
      ok: false,
      reason:
        `You entered ${claimed} GREATNESS Reports, and you taught ` +
        `${distinctChildrenThisWeek} ${distinctChildrenThisWeek === 1 ? "child" : "different children"} ` +
        `this week. A report is written about a child you taught, so the most you can claim ` +
        `is ${distinctChildrenThisWeek}. Nothing has been submitted.`,
    };
  }

  const max = greatnessMaxFor(input);
  if (claimed > max) {
    return {
      ok: false,
      reason:
        `You entered ${claimed} GREATNESS Reports. You have already claimed ` +
        `${claimedElsewhereThisMonth} this month, and the limit is one report per child per ` +
        `month, so the most you can add this week is ${max}. Nothing has been submitted.`,
    };
  }

  return { ok: true };
}

/** What the reports pay. Linear - five dollars each, no volume curve. */
export function greatnessGross(claimed: number, ratePerReport: number): number {
  if (claimed <= 0 || ratePerReport <= 0) return 0;
  return Math.round(claimed * ratePerReport * 100) / 100;
}
