/**
 * Turning stored rows into the two things people read: a teacher's week, and
 * Jimmy's payroll for that week.
 *
 * Pure, like rates.ts, and for the same reason. Both screens render whatever
 * this returns, so a mistake here is a mistake on every screen at once - and
 * a pure function is the only kind that can be checked completely before
 * anybody sees it.
 *
 * ITEMS 20 TO 23 OF JIMMY'S SPECIFICATION LIVE HERE:
 *   20  every student's name carries their primary school in parentheses
 *   21  a cumulative view of every teacher to pay, with individual amounts
 *   22  per teacher: each class, scheduled or guest, students scheduled,
 *       students absent, and whether it was Virtual or HS
 *   23  a week total, split by Virtual and HS
 */

import {
  type Campus,
  type ExtraClaim,
  type PersonalRate,
  EXTRA_RULES,
  classPay,
  classPayAt,
  extraPay,
  hourlyPay,
  weekTotals,
} from "@/lib/finance/teacher-pay/rates";

/* ------------------------------------------------------------------------ */
/* Item 20 — a child's name says which school they belong to                 */
/* ------------------------------------------------------------------------ */

/** The four primary schools a child is enrolled at, as a parent would say them. */
export type PrimarySchool = "virtual" | "ga" | "fl" | "hs";

/* AV, not "Virtual" - Jimmy, 2 October: "display them like this - Jimmy
   Arispe (AV)". It is what the roll is headed and what the office says. */
const SCHOOL_LABEL: Readonly<Record<PrimarySchool, string>> = {
  virtual: "AV",
  ga: "GA",
  fl: "FL",
  hs: "HS",
};

/**
 * "Ada Lovelace (AV)".
 *
 * WHY THE LABEL IS NOT OPTIONAL DECORATION. A teacher choosing children for a
 * class sees every student at every school (items 12 and 13), and on
 * 21 September a Virtual teacher's class of four campus children priced as
 * zero because nobody could see which school a child belonged to. The
 * parenthesis is how that stays visible while it is being chosen, not
 * discovered afterwards.
 *
 * A child with no primary school recorded is labelled so, rather than
 * silently appearing to belong to the school the teacher happens to teach at.
 */
export function studentLabel(name: string, school: PrimarySchool | null | undefined): string {
  const clean = name.trim() || "(unnamed student)";
  if (!school || !(school in SCHOOL_LABEL)) return `${clean} (no school recorded)`;
  return `${clean} (${SCHOOL_LABEL[school]})`;
}

/* ------------------------------------------------------------------------ */
/* A teacher's week                                                          */
/* ------------------------------------------------------------------------ */

export interface ClassRow {
  readonly entryId: string;
  /** She was down to teach this and did not. Pays nothing. */
  readonly missed?: boolean;
  readonly missedNote?: string | null;
  /**
   * Which class this is, so the week can count the other days of it.
   *
   * The NAME is not enough: two classes can share a name across campuses and
   * the copy action matches on course_id, so counting by name would promise
   * a copy the action then refuses. See otherDaysOfThisClass below.
   */
  readonly courseId?: string | null;
  readonly courseName: string;
  readonly campus: Campus;
  readonly classDate: string;
  /** "07:00" to "23:00". Stored and shown as a start time; duration is not. */
  readonly startTimeEt: string;
  readonly isGuest: boolean;
  /** Item 10 — whose class this is, when guesting. */
  readonly guestForName: string | null;
  readonly structuredLiteracy: boolean;
  /**
   * The rate from teacher_pay_courses, when the caller has it.
   *
   * Present means price from these and ignore structuredLiteracy entirely -
   * "1:1 Tutoring Structured Literacy" and "1:1 Tutoring Non-Structured
   * Literacy" differ by one word and by 15.00, and no flag derived from a
   * name can tell them apart. Absent keeps the old behaviour, so every test
   * written against the flag still describes something real.
   */
  readonly baseCents?: number;
  readonly perAdditionalCents?: number;
  readonly students: readonly {
    readonly studentId: string;
    readonly name: string;
    readonly school: PrimarySchool | null;
    readonly absent: boolean;
  }[];
}

export interface ClassLine {
  readonly entryId: string;
  readonly missed: boolean;
  readonly missedNote: string | null;
  readonly courseName: string;
  /**
   * How many OTHER days of this same class are on the week.
   *
   * Cassandra Manghum, 9 October 2026: "I see this: Put these 5 children on
   * the other days of this class but it is not allowing me to do so and it's
   * not letting me edit the other days of the week to add students."
   *
   * She had one day. The button copies a roster onto class entries that
   * already exist; it cannot create them. So it offered her something that
   * could not happen, and the refusal only arrived after she pressed it -
   * then she tried to add children straight to Tuesday, where there was no
   * class to add them to, and lost an evening on a Friday deadline.
   *
   * The screen now knows the answer before she presses anything.
   */
  readonly otherDaysOfThisClass: number;
  readonly campus: Campus;
  readonly classDate: string;
  readonly startTimeEt: string;
  readonly kind: "Scheduled class" | "Guest teaching";
  readonly guestForName: string | null;
  readonly scheduled: number;
  readonly absent: number;
  readonly cents: number;
  readonly studentLabels: readonly string[];
  /**
   * The children themselves, not only their labels.
   *
   * studentLabels is what a read-only screen prints. A screen that lets a
   * teacher CHANGE the roster needs the id - the first version of the grid
   * matched children by name, which cannot tell two Jessicas apart and
   * cannot see who is already marked absent at all. An id can do both.
   */
  readonly roster: readonly {
    readonly studentId: string;
    readonly name: string;
    readonly school: PrimarySchool | null;
    readonly absent: boolean;
  }[];
  /** Set when this line could not be priced. The line is still shown. */
  readonly problem: string | null;
}

export interface TeacherWeekView {
  readonly weekStart: string;
  readonly status: WeekStatus;
  readonly lines: readonly ClassLine[];
  readonly extras: readonly { readonly label: string; readonly detail: string; readonly cents: number; readonly problem: string | null }[];
  readonly classCents: number;
  readonly extrasCents: number;
  readonly totalCents: number;
  readonly virtualCents: number;
  readonly hsCents: number;
  readonly unattributedCents: number;
  readonly studentsScheduled: number;
  readonly studentsAbsent: number;
  readonly guestCount: number;
  /** Everything that could not be priced, so a total is never quietly short. */
  readonly problems: readonly string[];
  readonly kookyNote: string | null;
  /*
   * WHAT A PERSON DECIDED TO PAY, when that differs from what was worked
   * out above. Null means pay the computed figure.
   *
   * Carried BESIDE totalCents and never folded into it. A paysheet read in
   * March has to answer two questions - what did the platform compute, and
   * what did a person decide - and one number cannot answer both. Collapse
   * them and an override becomes indistinguishable from a fault in the rate
   * table, which is the worst thing that can happen to a pay record nobody
   * can reconstruct.
   */
  readonly overrideCents: number | null;
  readonly overrideReason: string | null;
}

export interface WeekInput {
  readonly weekStart: string;
  readonly status: WeekStatus;
  readonly overrideCents?: number | null;
  readonly overrideReason?: string | null;
  readonly classes: readonly ClassRow[];
  readonly extras: readonly ExtraClaim[];
  readonly hourly: readonly { readonly rate: PersonalRate; readonly hours: number }[];
  readonly kookyNote?: string | null;
}

/**
 * One teacher's week, priced and ready to render.
 *
 * A LINE THAT CANNOT BE PRICED IS STILL SHOWN, carrying its reason. Dropping
 * it would leave a teacher looking at a total that is short with no clue
 * where, which is the same failure as a class of four pricing as zero - just
 * arrived at politely.
 */
export function teacherWeekView(input: WeekInput): TeacherWeekView {
  const lines: ClassLine[] = [];

  for (const row of input.classes) {
    const scheduled = row.students.length;
    const absent = row.students.filter((s) => s.absent).length;

    /*
     * A CLASS SHE DID NOT TEACH PAYS NOTHING, decided HERE and not by
     * the rate code.
     *
     * Children stay ticked on a missed class on purpose - she marked who
     * was due, and whoever covered it needs that list. But a roster is
     * exactly what the pricing reads, so leaving this to classPay would
     * pay her for a morning she was not there. Zero is asserted before
     * the rate is ever consulted.
     */
    const missed = row.missed === true;
    /* The catalogue rate wins when the caller has it. See CataloguePayInput. */
    const priced =
      row.baseCents !== undefined
        ? classPayAt({
            scheduledStudents: scheduled,
            baseCents: row.baseCents,
            perAdditionalCents: row.perAdditionalCents ?? 0,
          })
        : classPay({ scheduledStudents: scheduled, structuredLiteracy: row.structuredLiteracy });

    lines.push({
      entryId: row.entryId,
      courseName: row.courseName,
      /* Matched on course id, exactly as copyRosterToMyOtherClassesAction
         matches, so the button and the action cannot disagree. */
      otherDaysOfThisClass: row.courseId
        ? input.classes.filter(
            (other) => other.entryId !== row.entryId && other.courseId === row.courseId
          ).length
        : 0,
      campus: row.campus,
      classDate: row.classDate,
      startTimeEt: row.startTimeEt,
      kind: row.isGuest ? "Guest teaching" : "Scheduled class",
      guestForName: row.isGuest ? row.guestForName : null,
      scheduled,
      absent,
      missed,
      missedNote: row.missedNote ?? null,
      cents: missed ? 0 : priced.ok ? priced.cents : 0,
      studentLabels: row.students.map((s) => studentLabel(s.name, s.school)),
      roster: row.students.map((s) => ({
        studentId: s.studentId,
        name: s.name,
        school: s.school,
        absent: s.absent,
      })),
      /* Not a problem, a decision. A missed class with no children on it
         would otherwise shout "could not be priced" at a teacher who
         told us plainly that she was not there. */
      problem: missed ? null : priced.ok ? null : priced.reason,
    });
  }

  /*
   * THE TOTAL READS THE SAME FACTS THE LINE READ.
   *
   * This map used to drop row.baseCents and row.missed, so weekTotals
   * re-priced each class from the structuredLiteracy boolean alone and
   * reached a different answer from the line directly above it. Jessica
   * Price, 9 October 2026: a class reading $35.00 over a Submit button
   * offering $20.00, because "1:1 Tutoring Structured Literacy" does not
   * START with "Structured Literacy" and isStructuredLiteracy uses
   * startsWith. Craig Mann and Holly Medlong were already approved short.
   *
   * Every field the pricing depends on is now carried through. The invariant
   * that keeps it that way is asserted in the tests: the sum of the line
   * amounts equals classCents, always.
   */
  const totals = weekTotals({
    classes: input.classes.map((row) => ({
      campus: row.campus,
      scheduledStudents: row.students.length,
      structuredLiteracy: row.structuredLiteracy,
      absentStudents: row.students.filter((s) => s.absent).length,
      guest: row.isGuest,
      baseCents: row.baseCents,
      perAdditionalCents: row.perAdditionalCents,
      missed: row.missed === true,
    })),
    extras: input.extras,
    hourly: input.hourly,
  });

  const extras = [
    ...input.extras.map((claim) => {
      const rule = EXTRA_RULES[claim.kind];
      const priced = extraPay(claim);
      return {
        label: rule?.label ?? claim.kind,
        detail: `${claim.quantity} × ${rule ? rule.per : "unit"}`,
        cents: priced.ok ? priced.cents : 0,
        problem: priced.ok ? null : priced.reason,
      };
    }),
    ...input.hourly.map((claim) => {
      const priced = hourlyPay(claim.rate, claim.hours);
      return {
        label: claim.rate.label,
        detail: `${claim.hours} hour${claim.hours === 1 ? "" : "s"}`,
        cents: priced.ok ? priced.cents : 0,
        problem: priced.ok ? null : priced.reason,
      };
    }),
  ];

  return {
    weekStart: input.weekStart,
    status: input.status,
    lines,
    extras,
    classCents: totals.classCents,
    extrasCents: totals.extrasCents + totals.hourlyCents,
    totalCents: totals.totalCents,
    virtualCents: totals.virtualCents,
    hsCents: totals.hsCents,
    unattributedCents: totals.unattributedCents,
    studentsScheduled: totals.studentsScheduled,
    studentsAbsent: totals.studentsAbsent,
    guestCount: totals.guestCount,
    problems: totals.refusals,
    kookyNote: input.kookyNote ?? null,
    overrideCents: input.overrideCents ?? null,
    overrideReason: input.overrideReason ?? null,
  };
}

/* ------------------------------------------------------------------------ */
/* Items 21 to 23 — what Jimmy reads                                         */
/* ------------------------------------------------------------------------ */

export interface PayrollLine {
  readonly employeeId: string;
  /**
   * The teacher_weeks row, so the screen can approve or reopen it.
   * Null when she has no week row at all - there is nothing to approve.
   */
  readonly weekId: string | null;
  readonly teacherName: string;
  readonly totalCents: number;
  readonly virtualCents: number;
  readonly hsCents: number;
  readonly unattributedCents: number;
  readonly classCount: number;
  readonly guestCount: number;
  readonly studentsScheduled: number;
  readonly studentsAbsent: number;
  readonly status: WeekStatus;
  readonly kookyNote: string | null;
  readonly overrideCents: number | null;
  readonly overrideReason: string | null;
  /** Item 22 — the classes themselves, so a week can be read, not just totalled. */
  readonly lines: readonly ClassLine[];
  /**
   * The extras and hours, itemised.
   *
   * WHY THEY HAD TO COME UP HERE. unattributedCents was carried to the payroll
   * screen and the screen had no way to say what it was made of, because the
   * claims themselves stopped at TeacherWeekView. So Peter Alouise's line read
   * "$1,145.00 · $0.00 AV · $1,130.00 HS" and the fifteen dollars between the
   * total and the split had no name and no explanation anywhere on the page.
   *
   * A number on a payroll screen that does not reconcile is not a rounding
   * question. It is the reader deciding whether to trust the screen.
   */
  readonly extras: TeacherWeekView["extras"];
  readonly problems: readonly string[];
}

export interface PayrollWeek {
  readonly weekStart: string;
  readonly teachers: readonly PayrollLine[];
  readonly totalCents: number;
  readonly virtualCents: number;
  readonly hsCents: number;
  readonly unattributedCents: number;
  /** Weeks still open when the roll-up was taken. Nothing should be paid on these. */
  readonly openCount: number;
  /** Submitted by the teacher, not yet approved. The amount can still move. */
  readonly submittedCount: number;
  /** Approved, and the amount is frozen at what was approved. */
  readonly approvedCount: number;
  /** Every teacher whose week contains something that could not be priced. */
  readonly withProblems: readonly string[];
}

/**
 * The payroll for one week, per items 21 to 23.
 *
 * SORTED BY LARGEST FIRST, deliberately. This roll-up is the ONLY control on
 * a model where the teacher chooses both the class and the roster that sets
 * their own pay - there is no prebuilt schedule to check against. A list in
 * alphabetical order hides the week that is twice everyone else's; a list in
 * descending order puts it on the first line. That is the difference between
 * a control and a report.
 *
 * Open weeks are counted, not hidden. Paying a week nobody has submitted is
 * the mistake this number exists to prevent.
 */
/**
 * Open, submitted, approved.
 *
 * APPROVED ARRIVED WITH MIGRATION 474 and the type had to follow it. Until
 * then loadTeacherWeek coerced anything that was not "submitted" to "open",
 * so an approved week would have rendered on a teacher's screen as editable -
 * Remove buttons, a student grid, the lot. The server actions would have
 * refused every one of those presses, which is a screen lying to somebody
 * rather than a hole, but a screen that lies is how a teacher spends ten
 * minutes on a week she cannot change.
 */
export type WeekStatus = "open" | "submitted" | "approved";

export function payrollWeek(input: {
  readonly weekStart: string;
  readonly teachers: readonly {
    readonly employeeId: string;
    /** Null when the teacher has no week row at all. Nothing to approve. */
    readonly weekId: string | null;
    readonly teacherName: string;
    readonly week: TeacherWeekView;
  }[];
}): PayrollWeek {
  const teachers: PayrollLine[] = input.teachers.map((t) => ({
    employeeId: t.employeeId,
    weekId: t.weekId,
    teacherName: t.teacherName,
    totalCents: t.week.totalCents,
    virtualCents: t.week.virtualCents,
    hsCents: t.week.hsCents,
    unattributedCents: t.week.unattributedCents,
    classCount: t.week.lines.length,
    guestCount: t.week.guestCount,
    studentsScheduled: t.week.studentsScheduled,
    studentsAbsent: t.week.studentsAbsent,
    status: t.week.status,
    kookyNote: t.week.kookyNote,
    overrideCents: t.week.overrideCents,
    overrideReason: t.week.overrideReason,
    lines: t.week.lines,
    extras: t.week.extras,
    problems: t.week.problems,
  }));

  teachers.sort((a, b) => b.totalCents - a.totalCents || a.teacherName.localeCompare(b.teacherName));

  return {
    weekStart: input.weekStart,
    teachers,
    totalCents: teachers.reduce((n, t) => n + t.totalCents, 0),
    virtualCents: teachers.reduce((n, t) => n + t.virtualCents, 0),
    hsCents: teachers.reduce((n, t) => n + t.hsCents, 0),
    unattributedCents: teachers.reduce((n, t) => n + t.unattributedCents, 0),
    openCount: teachers.filter((t) => t.status === "open").length,
    submittedCount: teachers.filter((t) => t.status === "submitted").length,
    approvedCount: teachers.filter((t) => t.status === "approved").length,
    withProblems: teachers.filter((t) => t.problems.length > 0).map((t) => t.teacherName),
  };
}

/** Cents as a person reads them. One place, so no screen invents its own. */
export function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
