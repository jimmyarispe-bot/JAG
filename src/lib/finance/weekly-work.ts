/**
 * Work a teacher types on her own week, that is not a class.
 *
 * Two of these exist today and they are the same shape, so they are one
 * mechanism with two entries rather than two files that drift:
 *
 *   admin_hourly       Katie Vetere, $25 an hour, up to 10 hours a week
 *   private_tutoring   Jessica Price, $35 a session
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE RATE DECIDES WHO SEES THE FIELD. NOBODY IS NAMED IN THIS FILE.
 *
 * Both are PERSON rates in work_pay_rates - Katie's $25 is hers, Jessica's $35
 * is hers - so "who may claim this" is already recorded as a fact about pay.
 * A field appears when workRateOn finds a rate in force for that person on that
 * week, and is absent otherwise. Give somebody else the rate and their sheet
 * grows the field with no code change; take it away and it disappears.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY private_tutoring AND NOT tutoring.
 *
 * Jimmy, 25 September: "just make jessica's similar to GRs or Admin and call it
 * tutoring. This is all she does. Its paid at $35 per session."
 *
 * There is ALREADY a Tutoring course. It has class rates - $20 for anybody, $30
 * for Craig Mann with Ivy - and prices from the timetable like any other class,
 * with a roster and a session. Jessica's $35 is a different thing wearing the
 * same word: a number she types, with no session behind it.
 *
 * Calling both of them "tutoring" in the data would put two prices on one name
 * and guarantee that somebody, some month, reconciles the wrong one. The code
 * is private_tutoring; the label a teacher reads is still "tutoring sessions",
 * because that is what she does.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS IS NOT.
 *
 * Not GREATNESS Reports. Those carry a monthly allowance and excluded months
 * because a report is about a child and inherits the child's limits. An hour of
 * admin and a tutoring session are just themselves, so the only bound here is
 * the top of the dropdown.
 *
 * Pure. No database, no clock, no request.
 */

export interface WeeklyWorkKind {
  /** Stable machine name, and the work_pay_rates code. Never the label. */
  readonly code: string;
  /** The question on the pay sheet. */
  readonly question: string;
  /** The tile heading next to Classes taught. */
  readonly tileLabel: string;
  /** Singular noun for a message: "hour", "session". */
  readonly unitNoun: string;
  /** Top of the dropdown. */
  readonly max: number;
  /** One line under the field, in the teacher's words. */
  readonly help: string;
}

export const WEEKLY_WORK_KINDS: readonly WeeklyWorkKind[] = [
  {
    code: "admin_hourly",
    question: "How many admin hours did you work this week?",
    tileLabel: "Admin hours",
    unitNoun: "hour",
    max: 10,
    help:
      "Admin work only - your classes are counted separately above. If you worked " +
      "more than ten hours in one week, tell Jimmy rather than splitting it across " +
      "weeks.",
  },
  {
    code: "private_tutoring",
    question: "How many tutoring sessions did you hold this week?",
    tileLabel: "Tutoring sessions",
    unitNoun: "session",
    /* Jessica does two or three. Twenty is headroom, not an expectation, and
       still small enough to be a dropdown rather than a text box. */
    max: 20,
    help:
      "One line per session you held this week. If a session did not happen, leave " +
      "it out rather than marking it and correcting later.",
  },
];

export function weeklyWorkKind(code: string): WeeklyWorkKind | null {
  return WEEKLY_WORK_KINDS.find((k) => k.code === code) ?? null;
}

export type WeeklyWorkRefusal = { readonly ok: false; readonly reason: string };
export type WeeklyWorkCheck = { readonly ok: true } | WeeklyWorkRefusal;

/**
 * May she claim this many?
 *
 * THE REFUSAL SAYS THE NUMBERS, like every other refusal on this sheet. A
 * person told only that something is invalid has to guess or write to Jimmy,
 * and both cost more than a sentence.
 */
export function checkWeeklyWorkClaim(input: {
  readonly kind: WeeklyWorkKind;
  readonly quantity: number;
  readonly hasRate: boolean;
}): WeeklyWorkCheck {
  const { kind, quantity, hasRate } = input;

  if (!Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, reason: `Choose a number of ${kind.unitNoun}s, zero or more.` };
  }

  if (quantity === 0) return { ok: true };

  if (!hasRate) {
    return {
      ok: false,
      reason:
        `You do not have a rate on record for this, so ${kind.unitNoun}s cannot be ` +
        `claimed on your sheet. Nothing has been saved - tell Jimmy.`,
    };
  }

  if (quantity > kind.max) {
    return {
      ok: false,
      reason:
        `You entered ${quantity} ${kind.unitNoun}s. The most that can be claimed on ` +
        `one week's sheet is ${kind.max}. If you genuinely did more than that, tell ` +
        `Jimmy rather than splitting it across weeks - a week should say what ` +
        `actually happened in it. Nothing has been submitted.`,
    };
  }

  return { ok: true };
}

/** What it pays. Linear, rounded to the cent. */
export function weeklyWorkGross(quantity: number, rate: number): number {
  if (quantity <= 0 || rate <= 0) return 0;
  return Math.round(quantity * rate * 100) / 100;
}

/** The choices in the dropdown: zero to the cap, whole numbers. */
export function weeklyWorkOptions(kind: WeeklyWorkKind): readonly number[] {
  return Array.from({ length: kind.max + 1 }, (_, n) => n);
}
