/**
 * What a teacher is paid, under the model Jimmy specified on 29 September 2026.
 *
 * PURE, AND SEPARATE FROM EVERY SCREEN AND EVERY TABLE. This is the second
 * time this network has built teacher pay. The first time the calculation ran
 * inside the teacher's own browser session and inside her own row-level
 * permissions, and it underpaid eleven people for a month without raising
 * anything - `computeClassPay` read enrolments the teacher could not see,
 * Postgres returned fewer rows, and a class of four priced as a class of
 * zero. A function that takes numbers and returns numbers cannot do that.
 *
 * FOUR DECISIONS, ALL JIMMY'S, ALL ON 29 SEPTEMBER:
 *
 *   1. Pay counts students SCHEDULED, not students present. A child who stays
 *      home does not reduce what the teacher earns; the class was prepared and
 *      taught. Absence is still recorded - it is just not a pay input.
 *   2. Guest teaching pays the SAME as a scheduled class. The old model paid a
 *      guest $5 less at the base; that discount is gone.
 *   3. Tutoring uses the same structure as a class.
 *   4. The week is Monday to Friday.
 *
 * MONEY IS IN INTEGER CENTS, as everywhere in this codebase. Float dollars are
 * how rounding errors become somebody's pay.
 */

/** Monday-to-Friday, per Jimmy, 29 September. */
export const PAY_WEEK_DAYS = 5;

/** $20.00 for the first student in any class but Structured Literacy. */
export const BASE_CLASS_CENTS = 2_000;

/** $35.00 for the first student in Structured Literacy. */
export const BASE_STRUCTURED_LITERACY_CENTS = 3_500;

/** $5.00 for every student after the first, in every class. */
export const PER_ADDITIONAL_STUDENT_CENTS = 500;

export interface ClassPayInput {
  /**
   * How many students the teacher scheduled for this class.
   *
   * SCHEDULED, NOT PRESENT. Absences are recorded elsewhere and do not reduce
   * pay - see decision 1 above. Passing the attended count here would silently
   * underpay every class that had an absence.
   */
  readonly scheduledStudents: number;
  /** Structured Literacy is the only class with a different base. */
  readonly structuredLiteracy: boolean;
}

export type ClassPay =
  | { readonly ok: true; readonly cents: number; readonly baseCents: number; readonly additional: number }
  | { readonly ok: false; readonly reason: string };

/**
 * What one class earns.
 *
 * A CLASS WITH NOBODY SCHEDULED EARNS NOTHING, and says so rather than paying
 * the base. There is no such thing as teaching nobody, and a base rate paid
 * for an empty class is the shape of a week that looks worked and was not.
 *
 * Refuses rather than guesses on anything that is not a whole, non-negative
 * count. A fractional or negative roster is a bug upstream, and pricing it
 * would turn that bug into money.
 */
export function classPay(input: ClassPayInput): ClassPay {
  const n = input.scheduledStudents;

  if (!Number.isInteger(n)) {
    return { ok: false, reason: `A class cannot have ${n} students scheduled.` };
  }
  if (n < 0) {
    return { ok: false, reason: "A class cannot have a negative number of students scheduled." };
  }
  if (n === 0) {
    return { ok: true, cents: 0, baseCents: 0, additional: 0 };
  }

  const baseCents = input.structuredLiteracy
    ? BASE_STRUCTURED_LITERACY_CENTS
    : BASE_CLASS_CENTS;
  const additional = n - 1;

  return {
    ok: true,
    cents: baseCents + additional * PER_ADDITIONAL_STUDENT_CENTS,
    baseCents,
    additional,
  };
}

/* ------------------------------------------------------------------------ */
/* Everything a teacher is paid for that is not a class                      */
/* ------------------------------------------------------------------------ */

export type ExtraKind =
  | "greatness_report"
  | "parent_conference"
  | "teacher_meeting"
  | "coaching_session"
  | "additional_hour";

export interface ExtraRule {
  readonly cents: number;
  /** Per what: a student, an occurrence, or an hour. Shown to the office. */
  readonly per: "student" | "occurrence" | "hour";
  /** Most that can be claimed in one calendar month. Null means no cap. */
  readonly monthlyCap: number | null;
  /**
   * Months in which this may be claimed at all, 1-12. Null means any month.
   *
   * December and May are conference months, and they are exactly the months
   * GREATNESS Reports are not written - the two rules are a pair, and a
   * calendar that allowed both in the same month would pay twice for the same
   * conversation.
   */
  readonly onlyMonths: readonly number[] | null;
  readonly exceptMonths: readonly number[] | null;
  readonly label: string;
}

export const EXTRA_RULES: Readonly<Record<ExtraKind, ExtraRule>> = {
  greatness_report: {
    cents: 500,
    per: "student",
    monthlyCap: null,
    onlyMonths: null,
    exceptMonths: [12, 5],
    label: "GREATNESS Report",
  },
  parent_conference: {
    cents: 1_500,
    per: "student",
    monthlyCap: null,
    onlyMonths: [12, 5],
    exceptMonths: null,
    label: "Parent/teacher conference",
  },
  teacher_meeting: {
    cents: 1_500,
    per: "occurrence",
    monthlyCap: 1,
    onlyMonths: null,
    exceptMonths: null,
    label: "Monthly teacher meeting",
  },
  coaching_session: {
    cents: 1_500,
    per: "occurrence",
    monthlyCap: 1,
    onlyMonths: null,
    exceptMonths: null,
    label: "Coaching session with Heather",
  },
  additional_hour: {
    cents: 1_500,
    per: "hour",
    monthlyCap: null,
    onlyMonths: null,
    exceptMonths: null,
    label: "Additional work (e.g. enrichment club)",
  },
};

export interface ExtraClaim {
  readonly kind: ExtraKind;
  /** Students, occurrences or hours, depending on the rule. */
  readonly quantity: number;
  /** Calendar month 1-12, so the month rules can be applied. */
  readonly month: number;
  /** How many of this kind the person has ALREADY been paid for this month. */
  readonly alreadyClaimedThisMonth?: number;
}

export type ExtraPay =
  | { readonly ok: true; readonly cents: number; readonly quantityPaid: number }
  | { readonly ok: false; readonly reason: string };

/**
 * What one claim earns, with its month rule and its cap applied.
 *
 * THE CAP IS ENFORCED HERE AND MUST ALSO BE ENFORCED IN THE DATABASE. This
 * function only sees what it is handed. A caller that forgets
 * `alreadyClaimedThisMonth` gets a second full payment and no complaint, which
 * is why the store needs its own unique constraint per person per month. Two
 * places, deliberately: the note on migration 376 records what happened last
 * time a rule lived in only one of them.
 */
export function extraPay(claim: ExtraClaim): ExtraPay {
  const rule = EXTRA_RULES[claim.kind];
  if (!rule) {
    return { ok: false, reason: `The JAG does not recognise "${claim.kind}" as something it pays for.` };
  }

  if (!Number.isFinite(claim.quantity) || claim.quantity < 0) {
    return { ok: false, reason: `${rule.label}: ${claim.quantity} is not a quantity.` };
  }
  if (rule.per !== "hour" && !Number.isInteger(claim.quantity)) {
    return { ok: false, reason: `${rule.label} is counted whole, not as ${claim.quantity}.` };
  }
  if (!Number.isInteger(claim.month) || claim.month < 1 || claim.month > 12) {
    return { ok: false, reason: `${claim.month} is not a month.` };
  }

  if (rule.onlyMonths && !rule.onlyMonths.includes(claim.month)) {
    return {
      ok: false,
      reason: `${rule.label} is only paid in ${monthNames(rule.onlyMonths)}.`,
    };
  }
  if (rule.exceptMonths && rule.exceptMonths.includes(claim.month)) {
    return {
      ok: false,
      reason: `${rule.label} is not paid in ${monthNames(rule.exceptMonths)}.`,
    };
  }

  const already = claim.alreadyClaimedThisMonth ?? 0;
  let quantityPaid = claim.quantity;
  if (rule.monthlyCap !== null) {
    const remaining = rule.monthlyCap - already;
    if (remaining <= 0) {
      return {
        ok: false,
        reason: `${rule.label} is paid at most ${rule.monthlyCap} time${rule.monthlyCap === 1 ? "" : "s"} a month, and that is already claimed.`,
      };
    }
    quantityPaid = Math.min(claim.quantity, remaining);
  }

  return { ok: true, cents: Math.round(quantityPaid * rule.cents), quantityPaid };
}

function monthNames(months: readonly number[]): string {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months.map((m) => names[m - 1] ?? String(m)).join(" and ");
}

/* ------------------------------------------------------------------------ */
/* Rates that belong to one named person                                     */
/* ------------------------------------------------------------------------ */

/**
 * Two rates in this network belong to a person rather than to a role.
 *
 * They are written here as data, not as branches in a calculation, so that
 * "who is paid differently" is one readable list rather than something you
 * find by reading the maths. Both came from Jimmy on 29 September.
 */
export interface PersonalRate {
  readonly cents: number;
  readonly per: "hour";
  readonly label: string;
  /** Hours claimable in one week, when the person is capped. */
  readonly weeklyHourCap: number | null;
}

export const CRAIG_MANN_IVY_ASH_TUTORING: PersonalRate = {
  cents: 3_000,
  per: "hour",
  label: "1:1 tutoring with Ivy Ash",
  weeklyHourCap: null,
};

/**
 * Katie Vetere's admin hours.
 *
 * Jimmy, 8 October 2026: "only on katie veters timesheet - include a box with
 * similar dropdown that is for \"Approved Admin Work\" @ $20 per hour".
 *
 * RENAMED AND REPRICED, NOT ADDED BESIDE. This rate already existed as "Admin
 * work" at $25.00 an hour. Jimmy ruled it a replacement rather than a second
 * claim, so there is one box on her sheet and not two.
 *
 * NO PAST PAY MOVES. teacher_hourly_claims was empty across the whole platform
 * on the day this changed - not one claim, by anybody, ever - because the box
 * had never once appeared on a screen. See RATE_KEYS_BY_EMPLOYEE in
 * week-store.ts for why, and for the fix.
 *
 * THE 20-HOUR CAP IS UNCHANGED, and deliberately so. Jimmy said a different
 * number and did not say which. Twenty is the figure already approved, so it
 * stands until he names another - changing it to a number he did not give
 * would be inventing a pay rule.
 */
export const KATIE_VETERE_ADMIN: PersonalRate = {
  cents: 2_000,
  per: "hour",
  label: "Approved Admin Work",
  weeklyHourCap: 20,
};

export type HourlyPay =
  | { readonly ok: true; readonly cents: number; readonly hoursPaid: number }
  | { readonly ok: false; readonly reason: string };

/**
 * An hourly claim against a personal rate.
 *
 * Katie submits 0 to 20 hours a week. Zero is a real answer - a week with no
 * admin work is not an error - so it is accepted and earns nothing, rather
 * than being refused and leaving her unable to submit the week at all.
 */
export function hourlyPay(rate: PersonalRate, hours: number): HourlyPay {
  if (!Number.isFinite(hours) || hours < 0) {
    return { ok: false, reason: `${rate.label}: ${hours} is not a number of hours.` };
  }
  if (rate.weeklyHourCap !== null && hours > rate.weeklyHourCap) {
    return {
      ok: false,
      reason: `${rate.label} is capped at ${rate.weeklyHourCap} hours a week; ${hours} were entered.`,
    };
  }
  return { ok: true, cents: Math.round(hours * rate.cents), hoursPaid: hours };
}

/* ------------------------------------------------------------------------ */
/* A week                                                                    */
/* ------------------------------------------------------------------------ */

/** Which school a class belongs to. Every total is also reported split this way. */
export type Campus = "virtual" | "hs";

export interface WeekClassEntry {
  readonly campus: Campus;
  readonly scheduledStudents: number;
  readonly structuredLiteracy: boolean;
  /** Recorded, and deliberately not a pay input. */
  readonly absentStudents: number;
  readonly guest: boolean;
  /**
   * The catalogue rate, when the caller has it. Present means price from
   * these and ignore structuredLiteracy entirely - the same rule the line
   * pricing in week-view.ts already follows.
   *
   * WHY THIS HAD TO BE ADDED. week-view priced each LINE from the catalogue
   * and then built this structure WITHOUT the catalogue, so weekTotals
   * re-priced the identical class from a boolean. For any course whose name
   * does not begin "Structured Literacy" but whose catalogue rate is not the
   * $20 default, the two answers differed and the screen showed both:
   *
   *   1:1 Tutoring Structured Literacy   line $35.00   total counted $20.00
   *   1:1 Tutoring Craig & Ivy           line $30.00   total counted $20.00
   *
   * Jessica Price, 9 October 2026, looking at a class worth $35.00 above a
   * Submit button offering $20.00. Craig Mann and Holly Medlong had already
   * been APPROVED short, by $50.00 and $30.00.
   */
  readonly baseCents?: number;
  readonly perAdditionalCents?: number;
  /**
   * She said she was not there. Pays nothing, and the children stay counted.
   *
   * The line pricing has asserted this since 2428941f. This structure did
   * not carry it, so a class struck through at $0.00 on the line was still
   * being added to the week total. Nobody had pressed the button yet.
   */
  readonly missed?: boolean;
}

export interface WeekTotals {
  readonly classCents: number;
  readonly extrasCents: number;
  readonly hourlyCents: number;
  readonly totalCents: number;
  /** Item 23: the week split by campus. Extras and hourly work belong to neither. */
  readonly virtualCents: number;
  readonly hsCents: number;
  readonly unattributedCents: number;
  readonly classCount: number;
  readonly guestCount: number;
  readonly studentsScheduled: number;
  readonly studentsAbsent: number;
  readonly refusals: readonly string[];
}

/**
 * Add a week up.
 *
 * REFUSALS ARE COLLECTED, NOT THROWN. One malformed entry must not cost a
 * teacher the other four days. Everything that priced is counted, everything
 * that did not is named, and the office sees both - a total that quietly
 * omitted a class would be worse than one that says which class it could not
 * price.
 *
 * Extras and hourly work are NOT attributed to a campus. A GREATNESS Report or
 * an hour of admin is not taught at Virtual or at HS, and splitting it would
 * mean inventing an attribution. It is reported as its own figure so the two
 * campus totals plus the unattributed figure always equal the week.
 */
export function weekTotals(input: {
  readonly classes: readonly WeekClassEntry[];
  readonly extras: readonly ExtraClaim[];
  readonly hourly: readonly { readonly rate: PersonalRate; readonly hours: number }[];
}): WeekTotals {
  const refusals: string[] = [];
  let classCents = 0;
  let virtualCents = 0;
  let hsCents = 0;
  let guestCount = 0;
  let studentsScheduled = 0;
  let studentsAbsent = 0;

  for (const entry of input.classes) {
    /*
     * COUNTED, THEN PAID, AND NEVER THE OTHER WAY ROUND. Who was scheduled
     * and who was away is a fact about the morning and stays true whether the
     * class paid or not - a missed class she had six children booked into is
     * still six children who turned up to nothing.
     */
    if (entry.guest) guestCount += 1;
    studentsScheduled += entry.scheduledStudents;
    studentsAbsent += Math.max(0, entry.absentStudents);

    /* Zero asserted before the rate is consulted, exactly as the line does. */
    if (entry.missed === true) continue;

    /* The catalogue rate wins when the caller has it, exactly as the line
       does. These two branches must stay the same shape as the pair in
       week-view.ts - they are pricing the same class. */
    const priced =
      entry.baseCents !== undefined
        ? classPayAt({
            scheduledStudents: entry.scheduledStudents,
            baseCents: entry.baseCents,
            perAdditionalCents: entry.perAdditionalCents ?? 0,
          })
        : classPay(entry);

    if (!priced.ok) {
      refusals.push(priced.reason);
      continue;
    }
    classCents += priced.cents;
    if (entry.campus === "virtual") virtualCents += priced.cents;
    else hsCents += priced.cents;
  }

  let extrasCents = 0;
  for (const claim of input.extras) {
    const priced = extraPay(claim);
    if (!priced.ok) {
      refusals.push(priced.reason);
      continue;
    }
    extrasCents += priced.cents;
  }

  let hourlyCents = 0;
  for (const claim of input.hourly) {
    const priced = hourlyPay(claim.rate, claim.hours);
    if (!priced.ok) {
      refusals.push(priced.reason);
      continue;
    }
    hourlyCents += priced.cents;
  }

  const unattributedCents = extrasCents + hourlyCents;

  return {
    classCents,
    extrasCents,
    hourlyCents,
    totalCents: classCents + unattributedCents,
    virtualCents,
    hsCents,
    unattributedCents,
    classCount: input.classes.length,
    guestCount,
    studentsScheduled,
    studentsAbsent,
    refusals,
  };
}


/**
 * What one class earns, when the rate comes from the catalogue.
 *
 * WHY THIS EXISTS BESIDE classPay(). classPay decides the base from a
 * structuredLiteracy flag, which was right while exactly one class had a
 * different rate. Jimmy's list of 2 October has three:
 *
 *   1:1 Tutoring Structured Literacy        3500 base
 *   1:1 Tutoring Non-Structured Literacy    2000 base
 *   1:1 Tutoring Craig & Ivy                3000 flat, no per-student amount
 *
 * The first two are one word apart, so any rule that reads a class NAME to
 * decide the money pays the wrong one. Each course now carries its own
 * figures in teacher_pay_courses, and this prices from those.
 *
 * classPay is left exactly as it is, still tested, still used by anything
 * that has only the flag.
 */
export interface CataloguePayInput {
  readonly scheduledStudents: number;
  readonly baseCents: number;
  /** Zero for a flat per-session rate - Craig and Ivy. */
  readonly perAdditionalCents: number;
}

export function classPayAt(input: CataloguePayInput): ClassPay {
  const n = input.scheduledStudents;

  if (!Number.isInteger(n)) {
    return { ok: false, reason: `A class cannot have ${n} students scheduled.` };
  }
  if (n < 0) {
    return { ok: false, reason: "A class cannot have a negative number of students." };
  }
  /* The same rule as classPay: nobody scheduled earns nothing, and says so
     rather than paying a base for a class that taught no one. */
  if (n === 0) {
    return { ok: false, reason: "Nobody was scheduled, so this class pays nothing." };
  }
  if (input.baseCents < 0 || input.perAdditionalCents < 0) {
    return { ok: false, reason: "This class has no agreed rate." };
  }

  const cents = input.baseCents + (n - 1) * input.perAdditionalCents;
  return {
    ok: true,
    cents,
    baseCents: input.baseCents,
    additional: Math.max(0, n - 1),
  };
}
