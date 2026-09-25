import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Teacher pay for classes taught in the virtual schools.
 *
 * The rule, from Jimmy on 18 September 2026: a teacher is paid a rate per
 * student ENROLLED in the section, for every class taught. Attendance is
 * recorded for the family and does not change what the teacher is owed - a
 * child who does not turn up was still taught for.
 *
 * WHY "ENROLLED AT THE TIME OF THE CLASS" AND NOT "ENROLLED NOW".
 *
 * A roster changes. If the count came from today's enrolment list, recalculating
 * August after a student drops in October would quietly reduce what a teacher
 * was already paid for August, and recalculating after a new student joins would
 * raise it. The same period would produce a different answer every time it was
 * asked, and the difference would be invisible.
 *
 * So the count is the roster AS IT STOOD on the day of the class: enrolled on or
 * before that date, and not dropped until after it. A pay period recalculated in
 * December returns exactly what it returned in August.
 *
 * NULL RATE IS NOT ZERO. A teacher with no agreed rate produces no row and is
 * named as skipped. A zero-pound row in a pay run is indistinguishable from a
 * teacher who taught nothing, and that is how somebody goes unpaid quietly.
 */

/** The two schools this applies to, by name, resolved to ids at query time. */
/**
 * RETIRED 25 September 2026. Kept only so nothing imports a missing symbol.
 *
 * This list decided which classes were paid per class, by NAME. Renaming
 * either school would have zeroed every teacher's pay in silence, and on 25
 * September it did something nearer: the lookup it fed is campus-gated, a
 * teacher could not read it, and the screen answered $0.00 with no error.
 *
 * Jimmy: "if pay is dependent on class and per kid and its the same in virtual
 * and hs ... then why are we even messing with schools?" Correct. The RATE
 * decides. A course with a class_pay_rates row is paid per class; a course
 * without one is not, which is FL and GA forever, with no list to maintain.
 */
export const VIRTUAL_SCHOOL_NAMES = ["The Academy Virtual", "The Academy HS"];

/** Roster statuses that count as "this child was in the class". */
const COUNTED_STATUSES = ["enrolled", "completed"];

/** Session statuses that mean the class did not happen, so nobody is paid for it. */
export const UNHELD_SESSION_STATUSES = ["cancelled", "no_show"];

export interface EnrollmentWindow {
  /** Who. Carried so a teacher can be shown the roster she is being paid for. */
  studentId: string;
  enrolledAt: string;
  droppedAt: string | null;
  status: string;
  /** Which weekdays this child attends: "M-F", "M/T/Th", ... */
  attendsDays: string;
  /** Tagged (FL) or (GA) on the schedule: attends a physical campus. */
  campusStudent: boolean;
}

/**
 * Campus children go to their campus on Friday afternoons, so they are not in
 * any virtual class that starts at or after this time. Jimmy, 20 September
 * 2026: "campus kids do have class on fridays. but not after 1pm".
 *
 * A class starting AT 13:00 is excluded - the school day ends at one, so a
 * one-o'clock class is not attended. If it should mean "started before it
 * turned one and may run past", this constant is the only thing to change.
 */
export const CAMPUS_FRIDAY_CUTOFF_ET = "13:00";

const DAY_NUMBER: Record<string, number> = { M: 1, T: 2, W: 3, TH: 4, F: 5 };
const ORDER = ["M", "T", "W", "TH", "F"];

/**
 * Which weekdays a pattern covers, as 1=Monday .. 5=Friday.
 *
 * Handles a range ("M-Th") and a list ("M/T/Th"). TH is checked before T so
 * "Th" is Thursday rather than Tuesday followed by a stray letter - the kind of
 * detail that would quietly move a child from Thursday to Tuesday and change
 * what two teachers are paid.
 *
 * An unrecognised pattern returns Monday to Friday rather than nothing. Erring
 * towards the full week means a strange value shows up as a roster that is too
 * big, which somebody notices; erring towards empty means a child silently
 * vanishes from every class, which nobody does.
 */
export function attendanceDays(pattern: string): Set<number> {
  const clean = (pattern ?? "").toUpperCase().replace(/\s/g, "");
  const full = new Set([1, 2, 3, 4, 5]);
  if (!clean || clean === "M-F") return full;

  const token = (t: string): number | null => DAY_NUMBER[t] ?? null;

  if (clean.includes("-")) {
    const [a, b] = clean.split("-");
    const from = token(a);
    const to = token(b);
    if (from === null || to === null || from > to) return full;
    const out = new Set<number>();
    for (let d = from; d <= to; d += 1) out.add(d);
    return out;
  }

  const parts = clean.split(/[/,]/).filter(Boolean);
  const out = new Set<number>();
  for (const part of parts) {
    const d = token(part);
    if (d === null) return full;
    out.add(d);
  }
  return out.size > 0 ? out : full;
}

/** 1=Monday .. 7=Sunday. Noon UTC so no timezone can nudge it to the day before. */
function weekdayOf(day: string): number {
  const d = new Date(`${day.slice(0, 10)}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

/**
 * Was this child in the class on the day it ran?
 *
 * Pure, and tested, because it is the one rule that decides how much money a
 * person is owed.
 *
 * THREE QUESTIONS, ALL OF WHICH MUST BE YES.
 *
 * 1. Is their enrolment a kind that counts?
 * 2. Had they started, and not yet left? Dropped ON the day still counts -
 *    they were taught that morning.
 * 3. DO THEY COME ON THAT WEEKDAY? Jimmy, 19 September 2026: "all are m-f
 *    unless they are marked at FL or GA then those are campus students who are
 *    m-th". The class runs five days; a campus child attends four. Without this
 *    check a class of eight with three campus children is counted as eight on
 *    every one of the term's thirteen Fridays, and the teacher is overpaid
 *    thirteen times over - invisibly, because the roster is correct and only
 *    the day is wrong.
 */
export function onRosterOn(
  enrollment: EnrollmentWindow,
  classDate: string,
  classStartsEt: string
): boolean {
  if (!COUNTED_STATUSES.includes(enrollment.status)) return false;

  const day = classDate.slice(0, 10);
  if (enrollment.enrolledAt.slice(0, 10) > day) return false;
  if (enrollment.droppedAt && enrollment.droppedAt.slice(0, 10) < day) return false;

  const weekday = weekdayOf(day);
  if (!attendanceDays(enrollment.attendsDays).has(weekday)) return false;

  /* FRIDAY AFTERNOONS BELONG TO THE CAMPUS. A campus child is in the morning
     classes and gone by the afternoon, so a Friday class at 13:00 or later has
     a smaller roster and pays less. Thirteen Fridays in the term across the
     thirteen sections that start at or after one o'clock - get this wrong and
     it is wrong 169 times. */
  if (enrollment.campusStudent && weekday === 5) {
    if (classStartsEt.slice(0, 5) >= CAMPUS_FRIDAY_CUTOFF_ET) return false;
  }

  return true;
}

export interface ClassRate {
  baseFirstStudent: number;
  perAdditionalStudent: number;
  guestBaseFirstStudent: number;
}

/**
 * What one class pays.
 *
 * A base for the FIRST enrolled student, plus a smaller amount for every
 * student beyond. From the pay schedule of 18 September 2026 - not a flat rate
 * per head, which would pay a six-child LitLab class 6 x 20 instead of 20 + 5 x 5.
 *
 * A guest covering somebody else's class earns a lower base and the same
 * per-student amount.
 *
 * NOBODY ENROLLED PAYS NOTHING. The schedule prices "the 1st student in
 * scheduled class", so the money starts at the first child. A class with an
 * empty roster still appears in the detail list at zero, because a session that
 * ran for nobody is worth seeing rather than hiding.
 */
export function grossForClass(
  rate: ClassRate,
  studentCount: number,
  isGuest = false
): number {
  if (studentCount <= 0) return 0;
  const base = isGuest ? rate.guestBaseFirstStudent : rate.baseFirstStudent;
  const beyondFirst = (studentCount - 1) * rate.perAdditionalStudent;
  return Math.round((base + beyondFirst) * 100) / 100;
}

/**
 * The rate in force on the day of the class.
 *
 * Rates are versioned rather than edited, so a period recalculated in December
 * prices at what it priced at in August. The same reasoning as counting the
 * roster as it stood on the day: a pay run asked twice must answer twice the
 * same, or nobody can trust either answer.
 */
export function rateOn(
  rates: (ClassRate & { effectiveFrom: string; employeeId: string | null })[],
  classDate: string,
  employeeId: string
): ClassRate | null {
  const day = classDate.slice(0, 10);

  /* A rate belonging to the person beats a rate belonging to nobody. Craig Mann
     tutors at 30.00 where tutoring otherwise pays 20.00, and the course rate
     must not quietly overwrite what he was promised. Same precedence as
     workRateOn in work-pay.ts, so every rate in the system behaves one way. */
  const eligible = rates.filter(
    (r) =>
      r.effectiveFrom.slice(0, 10) <= day &&
      (r.employeeId === null || r.employeeId === employeeId)
  );
  if (eligible.length === 0) return null;

  const mine = eligible.filter((r) => r.employeeId === employeeId);
  const pool = mine.length > 0 ? mine : eligible;

  return [...pool].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
}

export interface ClassPayRow {
  sessionId: string;
  employeeId: string;
  teacherName: string;
  schoolId: string;
  schoolName: string;
  courseName: string;
  sectionCode: string;
  classDate: string;
  studentCount: number;
  /*
   * WHICH children, not just how many.
   *
   * 21 September 2026. "4 on roster" is a number a teacher cannot check. The
   * fault found that day - 33 of 42 sections underpaying, because the pay
   * calculator could only see children at the teacher's own school - would
   * have been reported in week one if she could have seen "DigitLab: nobody"
   * beside a class she knows has four children in it.
   *
   * Ids only here. Names are fetched separately, through
   * student_names_for_my_classes(), so nothing in the pay path needs read
   * access to a student record.
   */
  studentIds: string[];
  ratePerStudent: number;
  /** Covered by somebody other than the section's usual teacher. */
  isGuest: boolean;
  gross: number;
}

export interface ClassPayPeriod {
  rows: ClassPayRow[];
  /** Teachers who taught in the period with no agreed rate. Named, never zeroed. */
  skippedForNoRate: { employeeId: string; teacherName: string; classes: number }[];
  unavailable: string | null;
}

/**
 * Every class taught in the two virtual schools between two dates, priced.
 *
 * Reads only. Nothing is written until somebody asks for the period to be
 * committed, so opening the screen can never move money.
 */
export async function computeClassPay(
  supabase: AuthClient,
  periodStart: string,
  periodEnd: string,
  /**
   * One teacher, or everybody when omitted.
   *
   * A teacher's own timesheet used to compute all thirteen people's pay and
   * keep one thirteenth of it, inside her own read permissions. The finance
   * screen still passes nothing and gets the whole period.
   */
  employeeId?: string | null
): Promise<ClassPayPeriod> {
  /*
   * A LABEL, NOT A GATE. 25 September 2026.
   *
   * This read used to decide which classes existed for pay, filtered by school
   * name. schools is campus-scoped by RLS (039 -> can_access_school), so a
   * teacher who was not assigned to the campus her own courses live at read
   * zero rows, with no error, and her week priced at $0.00 while telling her
   * nothing was scheduled. Renee Tracewell, this afternoon.
   *
   * Campus contributes nothing to what a class is worth. The rate comes from
   * the course, the count from the roster, the exceptions from employee_id on
   * the rate. So the name is now only printed, never consulted: an error or an
   * empty result costs a label and not a single penny of anybody's pay.
   */
  const { data: schools, error: schoolError } = await supabase
    .from("schools")
    .select("id, name");

  if (schoolError) {
    console.error("[class-pay] school names unavailable, labels only", schoolError.message);
  }

  const schoolById = new Map(
    ((schools ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name])
  );

  const sessionQuery = supabase
    .from("instructional_sessions")
    .select(
      /* A teacher's name lives on employee_profiles, not on employees - that
         table has no name columns at all - and the rate lives on the COURSE,
         in class_pay_rates, because Structured Literacy pays 35.00 where
         LitLab pays 20.00 for the same person.

         course_sections.instructor_employee_id is the section's usual teacher.
         When the session's instructor differs, somebody covered, and the class
         prices at the guest rate. */
      "id, scheduled_start, instructor_employee_id, course_section_id, " +
        "course_sections(section_code, instructor_employee_id, start_time_et, " +
        "courses(id, name, school_id, class_pay_rates(employee_id, base_first_student, " +
        "per_additional_student, guest_base_first_student, effective_from))), " +
        /* NAME THE FOREIGN KEY. instructional_sessions now points at employees
           TWICE - instructor_employee_id, and original_instructor_employee_id
           added by migration 406 to remember whose class it was before
           somebody covered it. A bare employees(...) embed became ambiguous
           the moment that column existed, and PostgREST refused the whole
           query: "more than one relationship was found". The teacher's screen
           showed "Could not price your classes" and nothing else.
           The hint says which one: the person who actually taught it. */
        "employees!instructor_employee_id(id, employee_profiles(first_name, last_name, display_name))"
    )
    .gte("scheduled_start", `${periodStart}T00:00:00`)
    .lte("scheduled_start", `${periodEnd}T23:59:59`)
    /* Jimmy, 19 September 2026: "if a teacher is absent or has technical issues
       and does not hold the class then they are not paid for that class." The
       default is paid; NOT holding it is the exception, and it is recorded by
       cancelling the session rather than by silence. */
    .not("session_status", "in", `(${UNHELD_SESSION_STATUSES.join(",")})`)
    .order("scheduled_start", { ascending: true });

  /* One teacher when the caller named one, everybody when not. A plain
     branch rather than a conditional inside .filter(), where "everybody"
     had to be encoded as a no-op and a reader had to work that out. The
     class she covered for a colleague is hers: instructor_employee_id is
     who actually taught it, the same column the guest rate turns on. */
  const { data: sessions, error: sessionError } = await (employeeId
    ? sessionQuery.eq("instructor_employee_id", employeeId)
    : sessionQuery);

  if (sessionError) {
    return { rows: [], skippedForNoRate: [], unavailable: sessionError.message };
  }

  /* Supabase returns an embedded relation as an object or as a one-element
     array depending on how it reads the relationship, and without generated
     Database types it hands back GenericStringError rather than a row shape.
     Non-generic on purpose: inferring T from `T | T[]` against an unknown
     collapses to {} and every property read below it fails to compile. */
  const one = (value: unknown): Record<string, unknown> | null => {
    const first = Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
    return first && typeof first === "object"
      ? (first)
      : null;
  };

  type SessionRow = Record<string, unknown>;
  const relevant: {
    session: SessionRow;
    schoolId: string;
    sectionId: string;
    employeeId: string;
  }[] = [];

  for (const raw of (sessions ?? []) as unknown as SessionRow[]) {
    const section = one(raw.course_sections);
    const course = section ? one(section.courses) : null;
    const schoolId = course?.school_id as string | undefined;
    const employeeId = raw.instructor_employee_id as string | undefined;
    const sectionId = raw.course_section_id as string | undefined;

    if (!employeeId || !sectionId) continue;

    /*
     * THE RATE DECIDES WHETHER A CLASS IS PAID PER CLASS.
     *
     * Replaces a filter on two hard-coded school names. A course carrying any
     * class_pay_rates row is paid per class; a course carrying none is not,
     * and is skipped in silence rather than reported as an unpaid class. That
     * is FL and GA, whose staff are W2, and it stays true without a list
     * anybody has to remember to update.
     *
     * Note the difference from the skip further down: NO RATES AT ALL means
     * this is not that kind of class. Rates that exist but none applying to
     * this teacher on this date is a real gap, and that one gets named.
     */
    const rateRowCount = ((course?.class_pay_rates ?? []) as unknown[]).length;
    if (rateRowCount === 0) continue;

    relevant.push({ session: raw, schoolId: schoolId ?? "", sectionId, employeeId });
  }

  if (relevant.length === 0) {
    return { rows: [], skippedForNoRate: [], unavailable: null };
  }

  /* One read for every roster in play, then counted per class date in memory.
     A query per session would be hundreds of round trips for one pay run. */
  const sectionIds = [...new Set(relevant.map((r) => r.sectionId))];
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("student_enrollments")
    .select("student_id, course_section_id, enrollment_status, enrolled_at, dropped_at, attends_days, campus_student")
    .in("course_section_id", sectionIds);

  if (enrollmentError) {
    return { rows: [], skippedForNoRate: [], unavailable: enrollmentError.message };
  }

  const rosterBySection = new Map<string, EnrollmentWindow[]>();
  for (const e of (enrollments ?? []) as unknown as Record<string, unknown>[]) {
    const sectionId = e.course_section_id as string;
    const list = rosterBySection.get(sectionId) ?? [];
    list.push({
      studentId: String(e.student_id ?? ""),
      enrolledAt: String(e.enrolled_at ?? ""),
      droppedAt: (e.dropped_at as string | null) ?? null,
      status: String(e.enrollment_status ?? ""),
      attendsDays: String(e.attends_days ?? "M-F"),
      campusStudent: Boolean(e.campus_student),
    });
    rosterBySection.set(sectionId, list);
  }

  const rows: ClassPayRow[] = [];
  const skipped = new Map<string, { employeeId: string; teacherName: string; classes: number }>();

  for (const { session, schoolId, sectionId, employeeId } of relevant) {
    const employee = one(session.employees);
    const profile = employee ? one(employee.employee_profiles) : null;
    const teacherName =
      (profile?.display_name as string | undefined) ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "Unnamed teacher";

    const classDate = String(session.scheduled_start).slice(0, 10);
    const section = one(session.course_sections);
    const course = section ? one(section.courses) : null;

    const rateRows = ((course?.class_pay_rates ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
      baseFirstStudent: Number(r.base_first_student),
      perAdditionalStudent: Number(r.per_additional_student),
      guestBaseFirstStudent: Number(r.guest_base_first_student),
      effectiveFrom: String(r.effective_from),
      employeeId: (r.employee_id as string | null) ?? null,
    }));
    const rate = rateOn(rateRows, classDate, employeeId);

    /* No rate is not a rate of nothing. Name the course and move on, because a
       zero-pound class in a pay run is indistinguishable from a class that
       never happened, and that is how somebody goes unpaid quietly. */
    if (!rate) {
      const entry = skipped.get(employeeId) ?? { employeeId, teacherName, classes: 0 };
      entry.classes += 1;
      skipped.set(employeeId, entry);
      continue;
    }

    /* Covered by somebody else: the session's instructor is not the section's
       usual one. Guest rate, and the row says so. */
    const usualTeacher = section?.instructor_employee_id as string | undefined;
    const isGuest = Boolean(usualTeacher && usualTeacher !== employeeId);

    const classStartsEt = String(section?.start_time_et ?? "00:00");
    /* One pass, one predicate. The list and the count come from the same
       filter so a screen can never show five names beside a four. */
    const onRoster = (rosterBySection.get(sectionId) ?? []).filter((e) =>
      onRosterOn(e, classDate, classStartsEt)
    );
    const studentCount = onRoster.length;
    const studentIds = onRoster.map((e) => e.studentId).filter(Boolean);

    rows.push({
      sessionId: String(session.id),
      employeeId,
      teacherName,
      schoolId,
      schoolName: schoolById.get(schoolId) ?? "",
      courseName: String(course?.name ?? "Course"),
      sectionCode: String(section?.section_code ?? ""),
      classDate,
      studentCount,
      studentIds,
      ratePerStudent: rate.perAdditionalStudent,
      isGuest,
      gross: grossForClass(rate, studentCount, isGuest),
    });
  }

  return { rows, skippedForNoRate: [...skipped.values()], unavailable: null };
}

export interface TeacherPayTotal {
  employeeId: string;
  teacherName: string;
  classes: number;
  students: number;
  gross: number;
}

/** What each teacher is owed for the period. Pure, so it can be tested. */
export function totalsByTeacher(rows: ClassPayRow[]): TeacherPayTotal[] {
  const totals = new Map<string, TeacherPayTotal>();

  for (const row of rows) {
    const entry = totals.get(row.employeeId) ?? {
      employeeId: row.employeeId,
      teacherName: row.teacherName,
      classes: 0,
      students: 0,
      gross: 0,
    };
    entry.classes += 1;
    entry.students += row.studentCount;
    entry.gross = Math.round((entry.gross + row.gross) * 100) / 100;
    totals.set(row.employeeId, entry);
  }

  return [...totals.values()].sort((a, b) => a.teacherName.localeCompare(b.teacherName));
}
