/**
 * Reading and opening a teacher's week, under the model Jimmy specified on
 * 29 September.
 *
 * WHAT THIS IS NOT. It is not src/lib/finance/teacher-week.ts, which reads the
 * 41-slot schedule, prices from class_pay_rates and freezes a figure the
 * browser supplied. That one stays where it is until a full cycle has run on
 * this one - migration 453 is explicit that nothing is dropped.
 *
 * THE DIVISION OF LABOUR, AND WHY IT IS THIS WAY. rates.ts and week-view.ts
 * are pure: numbers in, numbers out, 418 lines of tests and no database. This
 * module is the only part that talks to Postgres. So the money is testable
 * without a database and the database access is testable without arithmetic,
 * and a mistake in one cannot hide inside the other.
 *
 * NOTHING HERE COMPUTES PAY. It assembles a WeekInput and hands it to
 * teacherWeekView(). If a figure is ever wrong, there is exactly one file to
 * look in.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  CRAIG_MANN_IVY_ASH_TUTORING,
  KATIE_VETERE_ADMIN,
  /* Campus lives in rates.ts, not week-view.ts - the campus split is a pay
     concept before it is a display one, and week-view re-uses it. */
  type Campus,
  type ExtraClaim,
  type ExtraKind,
  type PersonalRate,
} from "@/lib/finance/teacher-pay/rates";
import {
  teacherWeekView,
  type ClassRow,
  type PrimarySchool,
  type TeacherWeekView,
  type WeekStatus,
} from "@/lib/finance/teacher-pay/week-view";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** The network runs on Eastern. Jimmy: "everyone else adjusts." */
export const NETWORK_TIME_ZONE = "America/New_York";

/** Item 11. Hourly, 7am to 11pm, and the duration is deliberately absent. */
export const START_HOURS: readonly string[] = Array.from({ length: 17 }, (_, i) =>
  `${String(i + 7).padStart(2, "0")}:00`
);

export const RATE_BY_KEY: Readonly<Record<string, PersonalRate>> = {
  craig_mann_ivy_ash_tutoring: CRAIG_MANN_IVY_ASH_TUTORING,
  katie_vetere_admin: KATIE_VETERE_ADMIN,
};

/**
 * Who holds a personal hourly rate.
 *
 * THE BUG THIS EXISTS TO FIX. hourlyRateKeysFor used to derive the list from
 * rate keys a teacher had ALREADY claimed against. A box that only appears
 * once you have used it, and can only be used through the box, is a door
 * locked from the inside: checked on 8 October 2026, teacher_hourly_claims
 * held ZERO rows across the entire platform. Katie Vetere's admin rate and
 * Craig Mann's Ivy Ash rate had both been live in the code for days and
 * neither had ever rendered on a screen, for anybody.
 *
 * Nobody was told. The rate was written, the screen read the wrong source,
 * and the teacher simply had nowhere to put the hours - the same shape as
 * step 3a, armed and never fired, and as Danni Treu's calendar, connected to
 * an address Google did not answer to.
 *
 * BY EMPLOYEE ID, NOT BY NAME OR EMAIL. A name is spelled two ways in two
 * tables in this build already - Cassandra Manghum on 8 October - and an
 * address changes when somebody moves campus. An id does neither.
 *
 * IN CODE, BESIDE THE RATES, ON PURPOSE. The rates themselves are already
 * named per person here; splitting the person from their rate across a table
 * and a constant would make two places to look and two places to disagree.
 * When this list outgrows a handful of people it earns a table, and that is
 * the moment to build one - not before.
 */
export const RATE_KEYS_BY_EMPLOYEE: Readonly<Record<string, readonly string[]>> = {
  /* Katie Vetere - katie.vetere@theacademyvirtual.org */
  "5b646b18-83f9-4855-b27f-d9b3111c80b4": ["katie_vetere_admin"],
  /* Craig Mann - craig.mann@theacademyhs.org */
  "dcf87a23-20d2-447b-964f-51902bdd4a18": ["craig_mann_ivy_ash_tutoring"],
};

/* -------------------------------------------------------------------------- */
/* Dates                                                                      */
/* -------------------------------------------------------------------------- */

/** Today in Eastern, never in whatever zone the server happens to run in. */
export function easternToday(now: Date = new Date()): string {
  const p: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-CA", {
    timeZone: NETWORK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)) {
    p[part.type] = part.value;
  }
  return `${p.year}-${p.month}-${p.day}`;
}

/** The Monday of the week containing this Eastern date. */
export function mondayOf(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const weekday = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (1 - weekday));
  return d.toISOString().slice(0, 10);
}

export function currentWeekStart(now: Date = new Date()): string {
  return mondayOf(easternToday(now));
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The first of the month a date falls in, which is how claim_month is stored. */
export function firstOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/**
 * How far a teacher may look: this week and last week. Nothing else.
 *
 * Jimmy, 2 October: "This week and last week only. Tightest - enough to check
 * what she submitted, nothing more."
 *
 * WHY A BOUND AT ALL. The week arrows walked by seven days with nothing at
 * either end, so a teacher could click forward into March and log classes
 * against a Monday five months away. Those weeks would surface on the payroll
 * screen when the date came round, as work nobody did. Looking back is
 * useful; logging forward is only a way to make a mistake nobody asked for.
 *
 * THIS IS THE BOUNDARY, NOT THE ARROWS. The page hides the arrow that would
 * leave the range, which is presentation - a URL is a string anybody can
 * type. Every write is checked against this too.
 */
export function reachableWeeks(now: Date = new Date()): { thisWeek: string; lastWeek: string } {
  const thisWeek = currentWeekStart(now);
  return { thisWeek, lastWeek: mondayOf(addDays(thisWeek, -7)) };
}

export function weekIsReachable(weekStart: string, now: Date = new Date()): boolean {
  const { thisWeek, lastWeek } = reachableWeeks(now);
  return weekStart === thisWeek || weekStart === lastWeek;
}

/* -------------------------------------------------------------------------- */
/* Campus and school names                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A school's name turned into the four-way label a teacher reads.
 *
 * Matched loosely on purpose. "The Academy Virtual", "Academy Virtual" and
 * "the academy virtual " are the same school, and a child silently labelled
 * "(no school recorded)" because of a trailing space is exactly the kind of
 * invisible wrongness item 20 exists to prevent.
 */
export function primarySchoolOf(schoolName: string | null | undefined): PrimarySchool | null {
  const n = (schoolName ?? "").toLowerCase();
  if (!n.trim()) return null;
  if (n.includes("virtual")) return "virtual";
  if (n.includes(" hs") || n.endsWith("hs") || n.includes("high school")) return "hs";
  if (n.includes(" fl") || n.endsWith("fl") || n.includes("florida")) return "fl";
  if (n.includes(" ga") || n.endsWith("ga") || n.includes("georgia")) return "ga";
  return null;
}

/** Which of the two paying campuses a course belongs to, from its school. */
export function campusOf(schoolName: string | null | undefined): Campus | null {
  const p = primarySchoolOf(schoolName);
  if (p === "virtual") return "virtual";
  if (p === "hs") return "hs";
  return null;
}

/* -------------------------------------------------------------------------- */
/* What the screen needs to offer                                             */
/* -------------------------------------------------------------------------- */

export interface CourseOption {
  readonly courseId: string;
  readonly name: string;
  /** From teacher_pay_courses. No screen and no rule reads the NAME for this. */
  readonly baseCents: number;
  readonly perAdditionalCents: number;
}

export interface StudentOption {
  readonly studentId: string;
  readonly name: string;
  readonly school: PrimarySchool | null;
}

export interface ColleagueOption {
  readonly employeeId: string;
  readonly name: string;
}

/**
 * Structured Literacy is the only class with a different base, and the rate
 * turns on the COURSE rather than on anything stored per entry - so this is
 * the one place that decides it, and the entry does not carry a copy that
 * could disagree.
 */
export function isStructuredLiteracy(courseName: string | null | undefined): boolean {
  return (courseName ?? "").trim().toLowerCase().startsWith("structured literacy");
}

const one = (value: unknown): Record<string, unknown> | null => {
  const first = Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
  return first && typeof first === "object" ? (first as Record<string, unknown>) : null;
};

const nameOf = (row: Record<string, unknown> | null): string =>
  [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();

/* -------------------------------------------------------------------------- */
/* The pickers                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The classes this teacher may log.
 *
 * READ FROM THE CATALOGUE, NOT FROM courses. teacher_pay_courses (migration
 * 463) holds Jimmy's fourteen, in his order, with what each one pays. A
 * course absent from it is not offered - which is how every old class
 * disappears from this picker without a single row being deleted.
 *
 * NO CAMPUS. Jimmy, 2 October: "no campus unless i specify". A class is not
 * a Virtual thing or an HS thing here; the teacher says which campus the
 * session was for when she logs it, and that is what splits the money on the
 * payroll screen.
 *
 * RESTRICTED CLASSES NEED A GRANT. Three of the fourteen are restricted -
 * Structured Literacy and its 1:1 form for seven named teachers, and
 * 1:1 Tutoring Craig & Ivy for Craig. No grant, not in the list, and
 * addClassAction refuses it again on the way in.
 */
export async function listCourseOptions(
  supabase: AuthClient,
  employeeId?: string
): Promise<{ courses: CourseOption[] } | { error: string }> {
  const [catalogue, grants] = await Promise.all([
    supabase
      .from("teacher_pay_courses")
      .select("course_id, base_cents, per_additional_cents, restricted, sort_order, courses(name)")
      .order("sort_order"),
    employeeId
      ? supabase
          .from("teacher_pay_course_grants")
          .select("course_id")
          .eq("employee_id", employeeId)
      : Promise.resolve({ data: [] as { course_id: string }[], error: null }),
  ]);

  if (catalogue.error) {
    return { error: `Could not read the class list: ${catalogue.error.message}` };
  }

  const granted = new Set(
    ((grants.data ?? []) as { course_id: string }[]).map((g) => String(g.course_id))
  );

  const courses: CourseOption[] = [];
  for (const row of (catalogue.data ?? []) as unknown as Record<string, unknown>[]) {
    const courseId = String(row.course_id);
    if (row.restricted && !granted.has(courseId)) continue;

    const name = String(one(row.courses)?.name ?? "").trim();
    /* A catalogue row whose course has vanished is a broken link, not a
       class. Left out rather than offered as a blank line. */
    if (!name) continue;

    courses.push({
      courseId,
      name,
      baseCents: Number(row.base_cents ?? 0),
      perAdditionalCents: Number(row.per_additional_cents ?? 0),
    });
  }

  return { courses };
}

/**
 * Every student at every school - items 12 and 13, in Jimmy's words, and the
 * reason is item 20's history: on 21 September a Virtual teacher's class of
 * four campus children priced as zero because the roster was derived from the
 * teacher's own school instead of chosen.
 *
 * IF THIS COMES BACK SHORT, IT IS A POLICY AND NOT A BUG HERE. Teachers hold
 * students.view, but the students table has its own row-level security and it
 * has been school-scoped before. A teacher who cannot see a child cannot
 * schedule them, and the class then prices low with nothing on screen saying
 * why - which is the 21 September failure returning by a different door. The
 * count is reported so the caller can say so out loud rather than render a
 * short list as if it were the whole school.
 */
/**
 * Every active child in the network, for the grid a teacher picks from.
 *
 * THIS USED TO READ public.students DIRECTLY AND IT RETURNED THE WRONG
 * ANSWER WITHOUT SAYING SO. Peter Alouise, 2 October 2026: "Most of my kids
 * are not on the list to be assigned into my classes." He was seeing nine
 * names, all AV - exactly The Academy Virtual's roll - out of seventy-seven.
 *
 * There was no school filter in this function then either. The cut was
 * underneath, in students_select_school_scoped, which for a teacher resolves
 * to can_access_school() and so to her own campus. No error, just fewer rows.
 *
 * That policy is right for student records and wrong for this one question.
 * Jimmy, 2 October: "i need to make sure every teacher can see all students
 * for every class." Virtual teachers teach children enrolled at FL, GA and
 * HS, and a teacher who cannot name the child she taught logs a class with
 * nobody on it - which pays her nothing.
 *
 * So the read goes through students_a_teacher_may_log() (migration 468), a
 * security-definer function returning FOUR COLUMNS for active children only,
 * with the who-is-asking check inside it. Four columns, one question. If a
 * fifth is ever needed, it is added there, with a reason.
 *
 * A MISSING FUNCTION IS REPORTED, NOT SWALLOWED. If 468 has not been run the
 * teacher sees a sentence telling her to say something, rather than an empty
 * grid she would read as "the children are gone".
 */
export async function listStudentOptions(
  supabase: AuthClient
): Promise<{ students: StudentOption[] } | { error: string }> {
  const { data, error } = await supabase.rpc("students_a_teacher_may_log");

  if (error) {
    return {
      error:
        `Could not read the student list: ${error.message}. ` +
        `Tell Jimmy or Heather - do not submit a class without its children on it.`,
    };
  }

  const students: StudentOption[] = [];
  for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
    const name = `${String(row.first_name ?? "").trim()} ${String(row.last_name ?? "").trim()}`.trim();
    students.push({
      studentId: String(row.student_id),
      name: name || "(unnamed student)",
      school: primarySchoolOf(row.school_name as string | undefined),
    });
  }
  return { students };
}

/** Whose class a guest is covering - item 10. See namesByEmployeeId. */
export async function listColleagues(
  supabase: AuthClient,
  exceptEmployeeId: string
): Promise<ColleagueOption[]> {
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("employment_status", "active");

  const ids = ((data ?? []) as { id: string }[])
    .map((r) => String(r.id))
    .filter((id) => id !== exceptEmployeeId);

  const names = await namesByEmployeeId(supabase, ids);

  return ids
    .map((employeeId) => ({ employeeId, name: names.get(employeeId) ?? employeeId }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* -------------------------------------------------------------------------- */
/* The week itself                                                            */
/* -------------------------------------------------------------------------- */

export interface LoadedWeek {
  readonly weekId: string | null;
  readonly weekStart: string;
  readonly view: TeacherWeekView;
  /** Set when the week could not be read. The screen prints this, never a zero. */
  readonly unavailable: string | null;
  /**
   * Hours already saved, by rate key, so the box can show them back.
   *
   * WHY THE VIEW IS NOT ENOUGH. teacherWeekView flattens an hourly claim into
   * a display row - a label and the words "8 hours" - which is right for
   * reading and useless for refilling a field. The input needs the number and
   * the key it belongs to.
   *
   * WHAT IT COSTS TO LEAVE OUT. HourlyRow opened at "0" regardless of what was
   * saved. Katie enters 8 hours on Monday; on Wednesday the week still totals
   * $160.00 but the box reads 0, and clicking into it and away again posts
   * zero - which deletes the row and the $160 with a success message. Nothing
   * on the screen says anything changed.
   */
  readonly hoursByRateKey: Readonly<Record<string, number>>;
}

/**
 * Open this teacher's week if it does not exist yet.
 *
 * A week is created by opening the screen, not by a nightly job - a teacher
 * who taught on Monday should find somewhere to record it on Monday. The
 * insert is allowed to collide: two tabs open at once is a unique-constraint
 * violation and not an error anybody should see.
 */
export async function ensureOpenWeek(
  supabase: AuthClient,
  employeeId: string,
  weekStart: string
): Promise<{ weekId: string } | { error: string }> {
  const existing = await supabase
    .from("teacher_weeks")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existing.data?.id) return { weekId: String(existing.data.id) };

  const created = await supabase
    .from("teacher_weeks")
    .insert({ employee_id: employeeId, week_start: weekStart, status: "open" })
    .select("id")
    .maybeSingle();

  if (created.data?.id) return { weekId: String(created.data.id) };

  /* Lost the race, or was refused. Read again before calling it a failure:
     a collision leaves a perfectly good week sitting there. */
  const after = await supabase
    .from("teacher_weeks")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (after.data?.id) return { weekId: String(after.data.id) };

  return {
    error:
      created.error?.message ??
      "Your week could not be opened, and no reason was given.",
  };
}

/**
 * One teacher's week, assembled and priced.
 *
 * Six reads, not one per class. A teacher with twenty classes and a dozen
 * children across them should not cost sixty round trips to look at.
 */
export async function loadTeacherWeek(
  supabase: AuthClient,
  employeeId: string,
  weekStart: string
): Promise<LoadedWeek> {
  const empty = (unavailable: string | null, status: WeekStatus = "open") => ({
    weekId: null,
    weekStart,
    unavailable,
    hoursByRateKey: {},
    view: teacherWeekView({ weekStart, status, classes: [], extras: [], hourly: [] }),
  });

  const { data: weekRow, error: weekError } = await supabase
    .from("teacher_weeks")
    .select("id, status, kooky_note, override_total_cents, override_reason")
    .eq("employee_id", employeeId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (weekError) return empty(`Could not read your week: ${weekError.message}`);
  if (!weekRow) return empty(null);

  const weekId = String(weekRow.id);
  /*
   * READ, NOT COERCED. This used to fold anything that was not "submitted"
   * into "open", which was harmless while those were the only two. Migration
   * 474 added "approved", and an approved week folded to "open" would render
   * on a teacher's screen with Remove buttons and a student grid on a week
   * she cannot touch. The server actions refuse every one of those presses,
   * so nothing could have been changed - but a screen that lies is how
   * somebody spends ten minutes on work that was never going to save.
   */
  const raw = String(weekRow.status ?? "open");
  const status: WeekStatus =
    raw === "submitted" || raw === "approved" ? raw : "open";
  const kookyNote = (weekRow.kooky_note as string | null) ?? null;
  /* Beside the computed figure, never folded into it. See TeacherWeekView. */
  const overrideCents =
    typeof weekRow.override_total_cents === "number" ? weekRow.override_total_cents : null;
  const overrideReason = (weekRow.override_reason as string | null) ?? null;

  const [entriesRes, extrasRes, hourlyRes] = await Promise.all([
    supabase
      .from("teacher_class_entries")
      .select(
        "id, course_id, campus, class_date, start_time_et, is_guest, guest_for_employee_id, " +
          "missed, missed_note, courses(name)"
      )
      .eq("teacher_week_id", weekId)
      .order("class_date")
      .order("start_time_et"),
    supabase
      .from("teacher_extra_claims")
      .select("id, kind, quantity, claim_month")
      .eq("teacher_week_id", weekId),
    supabase
      .from("teacher_hourly_claims")
      .select("id, rate_key, hours")
      .eq("teacher_week_id", weekId),
  ]);

  if (entriesRes.error) {
    return empty(`Could not read your classes: ${entriesRes.error.message}`, status);
  }

  const entryRows = (entriesRes.data ?? []) as unknown as Record<string, unknown>[];
  const entryIds = entryRows.map((e) => String(e.id));

  /* The children on those classes, and who they are. */
  const studentsByEntry = new Map<
    string,
    { studentId: string; name: string; school: PrimarySchool | null; absent: boolean }[]
  >();

  if (entryIds.length > 0) {
    const { data: rosterRows } = await supabase
      .from("teacher_class_students")
      .select("entry_id, student_id, absent, students(first_name, last_name, schools(name))")
      .in("entry_id", entryIds);

    for (const row of (rosterRows ?? []) as unknown as Record<string, unknown>[]) {
      const entryId = String(row.entry_id);
      const child = one(row.students);
      const list = studentsByEntry.get(entryId) ?? [];
      list.push({
        studentId: String(row.student_id),
        /* A name that cannot be read loses the name, never the pay - the count
           is what prices the class and it is already decided. */
        name: nameOf(child) || "(name unavailable)",
        school: primarySchoolOf(one(child?.schools)?.name as string | undefined),
        absent: Boolean(row.absent),
      });
      studentsByEntry.set(entryId, list);
    }
    for (const list of studentsByEntry.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  /* Whose class, for the guest entries only. */
  const guestIds = [
    ...new Set(
      entryRows
        .map((e) => (e.guest_for_employee_id ? String(e.guest_for_employee_id) : null))
        .filter((v): v is string => Boolean(v))
    ),
  ];
  const guestNameById =
    guestIds.length > 0 ? await namesByEmployeeId(supabase, guestIds) : new Map<string, string>();

  /* The rate for every class on the week, in one read. week-view prices from
     these rather than from the course name - see CataloguePayInput. */
  const courseIds = [...new Set(entryRows.map((e) => String(e.course_id)))];
  const rateByCourse = new Map<string, { base: number; per: number }>();
  if (courseIds.length > 0) {
    const { data: rates } = await supabase
      .from("teacher_pay_courses")
      .select("course_id, base_cents, per_additional_cents")
      .in("course_id", courseIds);
    for (const row of (rates ?? []) as unknown as Record<string, unknown>[]) {
      rateByCourse.set(String(row.course_id), {
        base: Number(row.base_cents ?? 0),
        per: Number(row.per_additional_cents ?? 0),
      });
    }
  }

  const classes: ClassRow[] = entryRows.map((e) => {
    const courseName = String(one(e.courses)?.name ?? "").trim() || "(class name unavailable)";
    const guestId = e.guest_for_employee_id ? String(e.guest_for_employee_id) : null;
    return {
      entryId: String(e.id),
      /* A class she was down for and did not teach. Priced at zero by
         week-view.ts before the roster is looked at. */
      missed: e.missed === true,
      missedNote: typeof e.missed_note === "string" ? e.missed_note : null,
      courseName,
      campus: (String(e.campus) === "hs" ? "hs" : "virtual") as Campus,
      classDate: String(e.class_date).slice(0, 10),
      startTimeEt: String(e.start_time_et).slice(0, 5),
      isGuest: Boolean(e.is_guest),
      guestForName: guestId ? (guestNameById.get(guestId) ?? "a colleague") : null,
      structuredLiteracy: isStructuredLiteracy(courseName),
      baseCents: rateByCourse.get(String(e.course_id))?.base,
      perAdditionalCents: rateByCourse.get(String(e.course_id))?.per,
      students: studentsByEntry.get(String(e.id)) ?? [],
    };
  });

  /*
   * THE MONTHLY CAPS NEED WHAT HAPPENED ON OTHER WEEKS.
   *
   * extraPay() applies a cap only against the number it is handed. rates.ts
   * says so in its own comment: "a caller that forgets
   * alreadyClaimedThisMonth gets a second full payment and no complaint". So
   * this reads the same person's claims of the same kind in the same month
   * from every OTHER week, and hands them over.
   *
   * The database carries the same rule as a unique index. Two places, on
   * purpose.
   */
  const extraRows = (extrasRes.data ?? []) as unknown as Record<string, unknown>[];
  const extras: ExtraClaim[] = [];

  if (extraRows.length > 0) {
    const months = [...new Set(extraRows.map((r) => String(r.claim_month).slice(0, 10)))];
    const { data: elsewhere } = await supabase
      .from("teacher_extra_claims")
      .select("kind, quantity, claim_month, teacher_week_id")
      .eq("employee_id", employeeId)
      .in("claim_month", months);

    const priorByKey = new Map<string, number>();
    for (const r of (elsewhere ?? []) as unknown as Record<string, unknown>[]) {
      if (String(r.teacher_week_id) === weekId) continue;
      const key = `${String(r.claim_month).slice(0, 10)}:${String(r.kind)}`;
      priorByKey.set(key, (priorByKey.get(key) ?? 0) + Number(r.quantity ?? 0));
    }

    for (const r of extraRows) {
      const month = String(r.claim_month).slice(0, 10);
      extras.push({
        kind: String(r.kind) as ExtraKind,
        quantity: Number(r.quantity ?? 0),
        month: Number(month.slice(5, 7)),
        alreadyClaimedThisMonth: priorByKey.get(`${month}:${String(r.kind)}`) ?? 0,
      });
    }
  }

  const hourly = ((hourlyRes.data ?? []) as unknown as Record<string, unknown>[])
    .map((r) => {
      const rate = RATE_BY_KEY[String(r.rate_key)];
      return rate ? { rate, hours: Number(r.hours ?? 0) } : null;
    })
    .filter((v): v is { rate: PersonalRate; hours: number } => v !== null);

  const hoursByRateKey: Record<string, number> = {};
  for (const r of (hourlyRes.data ?? []) as unknown as Record<string, unknown>[]) {
    const key = String(r.rate_key);
    if (key in RATE_BY_KEY) hoursByRateKey[key] = Number(r.hours ?? 0);
  }

  return {
    weekId,
    weekStart,
    unavailable: null,
    hoursByRateKey,
    view: teacherWeekView({
      weekStart,
      status,
      classes,
      extras,
      hourly,
      kookyNote,
      overrideCents,
      overrideReason,
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* The two person-specific hourly rates                                       */
/* -------------------------------------------------------------------------- */

/**
 * Which hourly rates this teacher has ever claimed.
 *
 * A GAP, NAMED RATHER THAN PAPERED OVER. Craig Mann's $30 tutoring and Katie
 * Vetere's $25 admin are person-specific in the spec, and NOTHING in the
 * database ties a rate_key to a person: teacher_hourly_claims has the key and
 * the hours and no owner. Migration 462's policies let a teacher write any
 * row on their own open week, so any teacher could in principle file hours
 * against either rate.
 *
 * Until a rate has an owner, this screen offers an hourly line only to
 * somebody who already has one - which keeps it out of twelve people's way
 * and lets Craig and Katie use theirs once seeded. That is a smaller door,
 * not a locked one, and it is written here so nobody later mistakes it for a
 * guard.
 */
export async function hourlyRateKeysFor(
  supabase: AuthClient,
  employeeId: string
): Promise<string[]> {
  /*
   * ASSIGNED FIRST, AND WITHOUT A QUERY. This is the half that was missing:
   * a rate a person holds shows up on their first week, before they have
   * claimed anything. See RATE_KEYS_BY_EMPLOYEE above for how long it was
   * broken and what it cost.
   */
  const assigned = (RATE_KEYS_BY_EMPLOYEE[employeeId] ?? []).filter(
    (k) => k in RATE_BY_KEY
  );

  const { data: weeks } = await supabase
    .from("teacher_weeks")
    .select("id")
    .eq("employee_id", employeeId);

  const weekIds = ((weeks ?? []) as { id: string }[]).map((w) => String(w.id));
  if (weekIds.length === 0) return [...new Set(assigned)];

  const { data } = await supabase
    .from("teacher_hourly_claims")
    .select("rate_key")
    .in("teacher_week_id", weekIds);

  /*
   * PAST CLAIMS ARE STILL READ, and they are not redundant. Somebody taken
   * off this list keeps the box for the weeks they already claimed in, so a
   * rate that ends does not erase the hours already entered under it and
   * leave a week that cannot be reconciled.
   */
  const claimed = ((data ?? []) as { rate_key: string }[])
    .map((r) => String(r.rate_key))
    .filter((k) => k in RATE_BY_KEY);

  return [...new Set([...assigned, ...claimed])];
}

/* -------------------------------------------------------------------------- */
/* Names                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * What to call a member of staff.
 *
 * WHY THIS IS A FUNCTION AND NOT A JOIN. The first version of the payroll
 * screen embedded `users(first_name, last_name, display_name)` off employees
 * and every single teacher came back as "employee 05546534". Jimmy saw a
 * payroll page naming thirteen people by the first eight characters of a uuid.
 *
 * The employees table has no name columns at all. Names live in two other
 * places - employee_profiles.display_name, which is what the pay calculator
 * has always read, and public.users, which is what the identity side reads -
 * and either can be empty for a given person.
 *
 * So this asks both, in that order, and selects * rather than naming columns:
 * a column list is a guess about a table's shape, and a wrong guess here
 * either errors or, worse, resolves to null and renders a uuid at somebody
 * who is owed money.
 *
 * The uuid fallback stays, because a teacher with no name recorded anywhere
 * must still appear on a payroll screen. It is the last resort, not the
 * first answer.
 */
export async function namesByEmployeeId(
  supabase: AuthClient,
  employeeIds: readonly string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = [...new Set(employeeIds.filter(Boolean))];
  if (ids.length === 0) return out;

  const pick = (row: Record<string, unknown> | undefined | null): string => {
    if (!row) return "";
    const s = (k: string) => String(row[k] ?? "").trim();
    return (
      s("display_name") ||
      s("full_name") ||
      [s("first_name"), s("last_name")].filter(Boolean).join(" ").trim() ||
      ""
    );
  };

  const [profilesRes, employeesRes] = await Promise.all([
    supabase.from("employee_profiles").select("*").in("employee_id", ids),
    supabase.from("employees").select("id, user_id").in("id", ids),
  ]);

  const profileByEmployee = new Map<string, Record<string, unknown>>();
  for (const row of (profilesRes.data ?? []) as unknown as Record<string, unknown>[]) {
    profileByEmployee.set(String(row.employee_id), row);
  }

  const userIdByEmployee = new Map<string, string>();
  for (const row of (employeesRes.data ?? []) as unknown as Record<string, unknown>[]) {
    if (row.user_id) userIdByEmployee.set(String(row.id), String(row.user_id));
  }

  const userById = new Map<string, Record<string, unknown>>();
  const userIds = [...new Set([...userIdByEmployee.values()])];
  if (userIds.length > 0) {
    const { data } = await supabase.from("users").select("*").in("id", userIds);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      userById.set(String(row.id), row);
    }
  }

  for (const id of ids) {
    const fromProfile = pick(profileByEmployee.get(id));
    const uid = userIdByEmployee.get(id);
    const fromUser = uid ? pick(userById.get(uid)) : "";
    out.set(id, fromProfile || fromUser || `employee ${id.slice(0, 8)}`);
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Who may teach Structured Literacy                                          */
/* -------------------------------------------------------------------------- */

/**
 * May this teacher log this class, and what does it pay?
 *
 * CHECKED SERVER-SIDE BECAUSE IT IS MONEY. listCourseOptions leaves a
 * restricted class out of the picker, and a dropdown is not a boundary - a
 * course id is a string in a form submission. Structured Literacy pays 35.00
 * where most classes pay 20.00 and Craig's session pays a flat 30.00, so the
 * answer is established again here before anything is written.
 *
 * A class that is not in the catalogue at all is refused. That is how the old
 * courses stay unusable after they are archived rather than deleted.
 */
export async function mayLogCourse(
  supabase: AuthClient,
  employeeId: string,
  courseId: string
): Promise<
  | { ok: true; baseCents: number; perAdditionalCents: number }
  | { ok: false; reason: string }
> {
  const { data: entry, error } = await supabase
    .from("teacher_pay_courses")
    .select("course_id, base_cents, per_additional_cents, restricted")
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) return { ok: false, reason: `That class could not be checked: ${error.message}` };
  if (!entry) {
    return { ok: false, reason: "That is not one of the classes on this year's list." };
  }

  if (entry.restricted) {
    const { data: grant } = await supabase
      .from("teacher_pay_course_grants")
      .select("course_id")
      .eq("employee_id", employeeId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!grant) {
      return {
        ok: false,
        reason:
          "That is not one of your classes. If that is wrong, ask Jimmy or Heather " +
          "and it can be added.",
      };
    }
  }

  return {
    ok: true,
    baseCents: Number(entry.base_cents ?? 0),
    perAdditionalCents: Number(entry.per_additional_cents ?? 0),
  };
}
