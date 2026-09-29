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
  extraPay,
  hourlyPay,
  weekTotals,
} from "@/lib/finance/teacher-pay/rates";

/* ------------------------------------------------------------------------ */
/* Item 20 — a child's name says which school they belong to                 */
/* ------------------------------------------------------------------------ */

/** The four primary schools a child is enrolled at, as a parent would say them. */
export type PrimarySchool = "virtual" | "ga" | "fl" | "hs";

const SCHOOL_LABEL: Readonly<Record<PrimarySchool, string>> = {
  virtual: "Virtual",
  ga: "GA",
  fl: "FL",
  hs: "HS",
};

/**
 * "Ada Lovelace (Virtual)".
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
  readonly courseName: string;
  readonly campus: Campus;
  readonly classDate: string;
  /** "07:00" to "23:00". Stored and shown as a start time; duration is not. */
  readonly startTimeEt: string;
  readonly isGuest: boolean;
  /** Item 10 — whose class this is, when guesting. */
  readonly guestForName: string | null;
  readonly structuredLiteracy: boolean;
  readonly students: readonly {
    readonly studentId: string;
    readonly name: string;
    readonly school: PrimarySchool | null;
    readonly absent: boolean;
  }[];
}

export interface ClassLine {
  readonly entryId: string;
  readonly courseName: string;
  readonly campus: Campus;
  readonly classDate: string;
  readonly startTimeEt: string;
  readonly kind: "Scheduled class" | "Guest teaching";
  readonly guestForName: string | null;
  readonly scheduled: number;
  readonly absent: number;
  readonly cents: number;
  readonly studentLabels: readonly string[];
  /** Set when this line could not be priced. The line is still shown. */
  readonly problem: string | null;
}

export interface TeacherWeekView {
  readonly weekStart: string;
  readonly status: "open" | "submitted";
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
}

export interface WeekInput {
  readonly weekStart: string;
  readonly status: "open" | "submitted";
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
    const priced = classPay({ scheduledStudents: scheduled, structuredLiteracy: row.structuredLiteracy });

    lines.push({
      entryId: row.entryId,
      courseName: row.courseName,
      campus: row.campus,
      classDate: row.classDate,
      startTimeEt: row.startTimeEt,
      kind: row.isGuest ? "Guest teaching" : "Scheduled class",
      guestForName: row.isGuest ? row.guestForName : null,
      scheduled,
      absent,
      cents: priced.ok ? priced.cents : 0,
      studentLabels: row.students.map((s) => studentLabel(s.name, s.school)),
      problem: priced.ok ? null : priced.reason,
    });
  }

  const totals = weekTotals({
    classes: input.classes.map((row) => ({
      campus: row.campus,
      scheduledStudents: row.students.length,
      structuredLiteracy: row.structuredLiteracy,
      absentStudents: row.students.filter((s) => s.absent).length,
      guest: row.isGuest,
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
  };
}

/* ------------------------------------------------------------------------ */
/* Items 21 to 23 — what Jimmy reads                                         */
/* ------------------------------------------------------------------------ */

export interface PayrollLine {
  readonly employeeId: string;
  readonly teacherName: string;
  readonly totalCents: number;
  readonly virtualCents: number;
  readonly hsCents: number;
  readonly unattributedCents: number;
  readonly classCount: number;
  readonly guestCount: number;
  readonly studentsScheduled: number;
  readonly studentsAbsent: number;
  readonly status: "open" | "submitted";
  readonly kookyNote: string | null;
  /** Item 22 — the classes themselves, so a week can be read, not just totalled. */
  readonly lines: readonly ClassLine[];
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
export function payrollWeek(input: {
  readonly weekStart: string;
  readonly teachers: readonly { readonly employeeId: string; readonly teacherName: string; readonly week: TeacherWeekView }[];
}): PayrollWeek {
  const teachers: PayrollLine[] = input.teachers.map((t) => ({
    employeeId: t.employeeId,
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
    lines: t.week.lines,
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
    withProblems: teachers.filter((t) => t.problems.length > 0).map((t) => t.teacherName),
  };
}

/** Cents as a person reads them. One place, so no screen invents its own. */
export function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
