import { easternDate } from "@/lib/scheduling/attendance-bridge";
import { computeClassPay, UNHELD_SESSION_STATUSES } from "@/lib/finance/class-pay";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * The week a teacher submits.
 *
 * A virtual teacher marks their classes held or not held in a Monday-to-Friday
 * table, sees what the week pays before they send it, verifies it, and submits
 * by 11:59pm Friday Eastern. It then goes to Jimmy to pay.
 *
 * START FORWARD. Jimmy's decision, 20 September 2026. Attendance had never been
 * recorded in JAG at all, and 1,025 classes had already been taught this year
 * with nothing saying which of them happened. Eleven people asked to remember
 * which Tuesdays happened six weeks ago would produce confident guesses, and a
 * guess in a pay record is worse than an acknowledged gap.
 *
 * This is a constant rather than a setting because it is a decision, not a
 * preference: moving it should require a commit that says why. The database
 * enforces the same boundary with a check constraint on week_start, so the two
 * cannot drift apart.
 */
export const WEEKLY_SUBMISSION_GO_LIVE = "2026-09-21";

/** Friday 23:59 Eastern. The network runs on Eastern; everyone else adjusts. */
export const WEEK_DEADLINE_ET = "23:59";

export interface WeekClass {
  sessionId: string;
  courseName: string;
  sectionCode: string;
  /** "09:00" in Eastern, for display. */
  startsEt: string;
  classDate: string;
  held: boolean;
  sessionStatus: string;
  /** Children on the roster for that class, as the pay calculator counted them. */
  studentCount: number;
  /** What this class pays. Zero when not held, or when no rate could be found. */
  gross: number;
  /** True when the class is held but no agreed rate exists - named, never zeroed silently. */
  unrated: boolean;
}

export interface WeekDay {
  /** 1 = Monday ... 5 = Friday */
  weekday: number;
  label: string;
  date: string;
  classes: WeekClass[];
  gross: number;
}

export interface TeacherWeek {
  employeeId: string;
  weekStart: string;
  weekEnd: string;
  days: WeekDay[];
  classesHeld: number;
  classesNotHeld: number;
  /** Live total while open. The FROZEN figure once submitted. */
  gross: number;
  status: "open" | "submitted";
  submittedAt: string | null;
  /** Set when the week cannot be shown. The screen prints this instead of a zero. */
  unavailable: string | null;
  /** True when this week begins before go-live and therefore does not exist. */
  beforeGoLive: boolean;
}

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The Monday of the week containing this Eastern date. */
export function mondayOf(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const weekday = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  return addDays(iso, 1 - weekday);
}

/** Today, in Eastern - not in whatever timezone the server happens to be in. */
export function easternTodayIso(now: Date = new Date()): string {
  return easternDate(now.toISOString());
}

export function currentWeekStart(now: Date = new Date()): string {
  return mondayOf(easternTodayIso(now));
}

function emptyWeek(
  employeeId: string,
  weekStart: string,
  unavailable: string | null,
  beforeGoLive = false
): TeacherWeek {
  return {
    employeeId,
    weekStart,
    weekEnd: addDays(weekStart, 4),
    days: [],
    classesHeld: 0,
    classesNotHeld: 0,
    gross: 0,
    status: "open",
    submittedAt: null,
    unavailable,
    beforeGoLive,
  };
}

/**
 * One teacher's Monday-to-Friday week, prefilled from the classes that already
 * exist. Nothing is typed from memory: every class in instructional_sessions
 * for that person in that week appears, including ones already marked not held,
 * because a teacher has to be able to see and undo their own mark.
 *
 * READ ONLY. Opening this screen never moves money and never writes a row.
 */
export async function getTeacherWeek(
  supabase: AuthClient,
  employeeId: string,
  weekStart: string
): Promise<TeacherWeek> {
  if (weekStart < WEEKLY_SUBMISSION_GO_LIVE) {
    return emptyWeek(
      employeeId,
      weekStart,
      `Weekly submission starts on Monday ${WEEKLY_SUBMISSION_GO_LIVE}. ` +
        `Anything before that was settled the way it always has been - there is nothing here you missed.`,
      true
    );
  }

  const weekEnd = addDays(weekStart, 4);

  /* EVERY session, including the ones marked not held. computeClassPay
     deliberately excludes those, so it cannot be the only source here. */
  const { data: rawSessions, error: sessionError } = await supabase
    .from("instructional_sessions")
    .select(
      "id, scheduled_start, session_status, course_section_id, " +
        "course_sections(section_code, start_time_et, courses(name))"
    )
    .eq("instructor_employee_id", employeeId)
    .gte("scheduled_start", `${weekStart}T00:00:00`)
    .lte("scheduled_start", `${weekEnd}T23:59:59`)
    .order("scheduled_start", { ascending: true });

  if (sessionError) {
    return emptyWeek(employeeId, weekStart, `Could not read your classes: ${sessionError.message}`);
  }

  /* The pay calculator is the single source of what a class is worth - rate
     resolution, the roster on that day, the campus Friday cutoff. Calling it
     rather than recomputing keeps one answer in the system. */
  const pay = await computeClassPay(supabase, weekStart, weekEnd);
  if (pay.unavailable) {
    return emptyWeek(employeeId, weekStart, `Could not price your classes: ${pay.unavailable}`);
  }

  const paidBySession = new Map(
    pay.rows.filter((r) => r.employeeId === employeeId).map((r) => [r.sessionId, r])
  );

  const one = (value: unknown): Record<string, unknown> | null => {
    const first = Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
    return first && typeof first === "object" ? first : null;
  };

  const byDate = new Map<string, WeekClass[]>();

  for (const raw of (rawSessions ?? []) as unknown as Record<string, unknown>[]) {
    const section = one(raw.course_sections);
    const course = section ? one(section.courses) : null;
    const sessionId = raw.id as string;
    const status = (raw.session_status as string | null) ?? "scheduled";
    const held = !UNHELD_SESSION_STATUSES.includes(status);
    const priced = paidBySession.get(sessionId);
    const classDate = easternDate(raw.scheduled_start as string);

    byDate.set(classDate, [
      ...(byDate.get(classDate) ?? []),
      {
        sessionId,
        courseName: (course?.name as string | null) ?? "Class",
        sectionCode: (section?.section_code as string | null) ?? "",
        startsEt: ((section?.start_time_et as string | null) ?? "").slice(0, 5),
        classDate,
        held,
        sessionStatus: status,
        studentCount: priced?.studentCount ?? 0,
        gross: priced?.gross ?? 0,
        /* Held, but the pay calculator could not price it. Shown as a problem
           rather than quietly counted as zero. */
        unrated: held && !priced,
      },
    ]);
  }

  const days: WeekDay[] = DAY_LABELS.map((label, index) => {
    const date = addDays(weekStart, index);
    const classes = byDate.get(date) ?? [];
    return {
      weekday: index + 1,
      label,
      date,
      classes,
      gross: Math.round(classes.reduce((sum, c) => sum + c.gross, 0) * 100) / 100,
    };
  });

  const all = days.flatMap((d) => d.classes);

  const { data: submission } = await supabase
    .from("teacher_week_submissions")
    .select("status, submitted_at, gross_cents")
    .eq("employee_id", employeeId)
    .eq("week_start", weekStart)
    .maybeSingle();

  const submitted = submission?.status === "submitted";

  return {
    employeeId,
    weekStart,
    weekEnd,
    days,
    classesHeld: all.filter((c) => c.held).length,
    classesNotHeld: all.filter((c) => !c.held).length,
    /* THE FROZEN FIGURE WINS ONCE SUBMITTED. A submitted week is a receipt, not
       a formula: recomputing it would let a later roster or rate change rewrite
       what the teacher verified and agreed to. */
    gross: submitted
      ? ((submission?.gross_cents as number | null) ?? 0) / 100
      : Math.round(all.reduce((sum, c) => sum + c.gross, 0) * 100) / 100,
    status: submitted ? "submitted" : "open",
    submittedAt: (submission?.submitted_at as string | null) ?? null,
    unavailable: null,
    beforeGoLive: false,
  };
}
