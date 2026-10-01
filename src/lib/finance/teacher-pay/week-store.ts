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
  readonly campus: Campus;
  readonly structuredLiteracy: boolean;
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
 * Every class, on every day, at every hour - item 8. Nothing is prefilled and
 * nothing is filtered by what the teacher taught last week, because the whole
 * point of the new model is that there is no prebuilt schedule to deviate
 * from.
 *
 * Only Virtual and HS courses are offered. FL and GA classes are out of scope
 * for this system (the spec says so in its first line), and a course whose
 * school cannot be resolved is left out rather than guessed into a campus
 * that decides where the money is filed.
 */
export async function listCourseOptions(
  supabase: AuthClient
): Promise<{ courses: CourseOption[] } | { error: string }> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, schools(name)")
    .order("name");

  if (error) return { error: `Could not read the class list: ${error.message}` };

  const courses: CourseOption[] = [];
  for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
    const campus = campusOf(one(row.schools)?.name as string | undefined);
    if (!campus) continue;
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    courses.push({
      courseId: String(row.id),
      name,
      campus,
      structuredLiteracy: isStructuredLiteracy(name),
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
export async function listStudentOptions(
  supabase: AuthClient
): Promise<{ students: StudentOption[] } | { error: string }> {
  const { data, error } = await supabase
    .from("students")
    .select("id, first_name, last_name, status, schools(name)")
    .order("last_name");

  if (error) return { error: `Could not read the student list: ${error.message}` };

  const students: StudentOption[] = [];
  for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
    const status = String(row.status ?? "").toLowerCase();
    if (status && status !== "active") continue;
    students.push({
      studentId: String(row.id),
      name: nameOf(row) || "(unnamed student)",
      school: primarySchoolOf(one(row.schools)?.name as string | undefined),
    });
  }
  return { students };
}

/** Whose class a guest is covering - item 10. Names live on users, not employees. */
export async function listColleagues(
  supabase: AuthClient,
  exceptEmployeeId: string
): Promise<ColleagueOption[]> {
  const { data } = await supabase
    .from("employees")
    .select("id, employment_status, users(first_name, last_name, display_name)")
    .eq("employment_status", "active");

  return ((data ?? []) as unknown as Record<string, unknown>[])
    .filter((r) => String(r.id) !== exceptEmployeeId)
    .map((r) => {
      const u = one(r.users);
      return {
        employeeId: String(r.id),
        name:
          (u?.display_name as string | undefined)?.trim() ||
          nameOf(u) ||
          `employee ${String(r.id).slice(0, 8)}`,
      };
    })
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
  const empty = (unavailable: string | null, status: "open" | "submitted" = "open") => ({
    weekId: null,
    weekStart,
    unavailable,
    view: teacherWeekView({ weekStart, status, classes: [], extras: [], hourly: [] }),
  });

  const { data: weekRow, error: weekError } = await supabase
    .from("teacher_weeks")
    .select("id, status, kooky_note")
    .eq("employee_id", employeeId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (weekError) return empty(`Could not read your week: ${weekError.message}`);
  if (!weekRow) return empty(null);

  const weekId = String(weekRow.id);
  const status = (String(weekRow.status ?? "open") === "submitted" ? "submitted" : "open") as
    | "open"
    | "submitted";
  const kookyNote = (weekRow.kooky_note as string | null) ?? null;

  const [entriesRes, extrasRes, hourlyRes] = await Promise.all([
    supabase
      .from("teacher_class_entries")
      .select(
        "id, course_id, campus, class_date, start_time_et, is_guest, guest_for_employee_id, " +
          "courses(name)"
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
  const guestNameById = new Map<string, string>();
  if (guestIds.length > 0) {
    const { data: colleagues } = await supabase
      .from("employees")
      .select("id, users(first_name, last_name, display_name)")
      .in("id", guestIds);
    for (const row of (colleagues ?? []) as unknown as Record<string, unknown>[]) {
      const u = one(row.users);
      guestNameById.set(
        String(row.id),
        (u?.display_name as string | undefined)?.trim() ||
          nameOf(u) ||
          `employee ${String(row.id).slice(0, 8)}`
      );
    }
  }

  const classes: ClassRow[] = entryRows.map((e) => {
    const courseName = String(one(e.courses)?.name ?? "").trim() || "(class name unavailable)";
    const guestId = e.guest_for_employee_id ? String(e.guest_for_employee_id) : null;
    return {
      entryId: String(e.id),
      courseName,
      campus: (String(e.campus) === "hs" ? "hs" : "virtual") as Campus,
      classDate: String(e.class_date).slice(0, 10),
      startTimeEt: String(e.start_time_et).slice(0, 5),
      isGuest: Boolean(e.is_guest),
      guestForName: guestId ? (guestNameById.get(guestId) ?? "a colleague") : null,
      structuredLiteracy: isStructuredLiteracy(courseName),
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

  return {
    weekId,
    weekStart,
    unavailable: null,
    view: teacherWeekView({ weekStart, status, classes, extras, hourly, kookyNote }),
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
  const { data: weeks } = await supabase
    .from("teacher_weeks")
    .select("id")
    .eq("employee_id", employeeId);

  const weekIds = ((weeks ?? []) as { id: string }[]).map((w) => String(w.id));
  if (weekIds.length === 0) return [];

  const { data } = await supabase
    .from("teacher_hourly_claims")
    .select("rate_key")
    .in("teacher_week_id", weekIds);

  return [
    ...new Set(
      ((data ?? []) as { rate_key: string }[])
        .map((r) => String(r.rate_key))
        .filter((k) => k in RATE_BY_KEY)
    ),
  ];
}
