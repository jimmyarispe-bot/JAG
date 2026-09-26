import { easternDate } from "@/lib/scheduling/attendance-bridge";
import { computeClassPay, UNHELD_SESSION_STATUSES } from "@/lib/finance/class-pay";
import {
  GREATNESS_WORK_CODE,
  GREATNESS_DROPDOWN_MAX,
  greatnessAppliesTo,
  greatnessGross,
  greatnessMaxFor,
} from "@/lib/finance/greatness-reports";
import { workRateOn, type WorkRate } from "@/lib/finance/work-pay";
import {
  WEEKLY_WORK_KINDS,
  weeklyWorkGross,
  type WeeklyWorkKind,
} from "@/lib/finance/weekly-work";
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

/**
 * The network's own clock. Deadlines, pay weeks and every leadership screen are
 * read in this zone and no other - Jimmy, Danni and Heather see Eastern whatever
 * machine they are sitting at, because a payroll cutoff that moves with the
 * reader is not a cutoff.
 */
export const NETWORK_TIME_ZONE = "America/New_York";

/**
 * A class time a person can read.
 *
 * TWELVE HOUR, WITH AM OR PM. "13:00" is a database value, not something to put
 * in front of a teacher at seven in the morning.
 *
 * A TEACHER SEES HER OWN CLOCK. The instant is the same everywhere; only the
 * reading changes. A teacher outside Eastern who is shown 1:00 PM for a class
 * that starts at 10:00 her time will miss it, and be right to.
 *
 * THE ZONE IS NAMED ONLY WHEN IT IS NOT THE NETWORK'S. Eastern readers - almost
 * everyone - get a clean "1:00 PM". Anyone else gets "10:00 AM MST", so the
 * difference is visible rather than assumed.
 *
 * An unknown or malformed zone falls back to Eastern rather than throwing:
 * Intl rejects a bad timeZone, and a timesheet must never fail to render
 * because somebody typed their timezone in wrong.
 */
export function formatClassTime(
  iso: string,
  timeZone: string = NETWORK_TIME_ZONE
): string {
  if (!iso) return "";
  const zone = timeZone || NETWORK_TIME_ZONE;
  const render = (tz: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      ...(tz === NETWORK_TIME_ZONE ? {} : { timeZoneName: "short" as const }),
    }).format(new Date(iso));
  try {
    return render(zone);
  } catch {
    return render(NETWORK_TIME_ZONE);
  }
}

export interface WeekClass {
  sessionId: string;
  courseName: string;
  sectionCode: string;
  /** "09:00" in Eastern. Kept for sorting and for anything that reasons in ET. */
  startsEt: string;
  /** The real instant the class starts, so it can be shown in any timezone. */
  startsAtIso: string;
  classDate: string;
  held: boolean;
  sessionStatus: string;
  /** Children on the roster for that class, as the pay calculator counted them. */
  studentCount: number;
  /**
   * WHO those children are.
   *
   * A number a teacher cannot check is a number she has to take on trust. On
   * 21 September a roster of four showed as "no students" on 33 of 42 sections
   * and nobody could see it, because the screen only ever showed the count.
   *
   * Empty when the names could not be fetched. The count still stands - it is
   * computed from the same rows - so a failure here loses the detail, never
   * the pay.
   */
  students: { id: string; name: string; present: boolean }[];
  /** What this class pays. Zero when not held, or when no rate could be found. */
  gross: number;
  /** True when the class is held but no agreed rate exists - named, never zeroed silently. */
  unrated: boolean;
  /**
   * Cover.
   *
   * coveredAway: this was her class and somebody else taught it. It stays on
   * her week so it does not vanish, and it pays her nothing.
   * coveringFor: she took somebody else's class. It pays her, at the same rate
   * as her own work since migration 401.
   */
  coveredAway: boolean;
  coveringFor: boolean;
}

export interface WeekDay {
  /** 1 = Monday ... 5 = Friday */
  weekday: number;
  label: string;
  date: string;
  classes: WeekClass[];
  gross: number;
}

/**
 * The GREATNESS Reports line on a week.
 *
 * A count, not a list of children - Jimmy asked for one dropdown. The ceiling
 * does the work the list would have done: see greatness-reports.ts for why the
 * weekly cap alone cannot hold a monthly rule.
 */
export interface WeekGreatness {
  /** False in May and December, when parent conferences happen instead. */
  applies: boolean;
  /** What she has chosen for this week. Zero until she picks something. */
  claimed: number;
  /** The most she may choose. Already accounts for the rest of the month. */
  max: number;
  /** Distinct children she taught this week, held classes only. */
  distinctChildren: number;
  /** Claimed on OTHER weeks in this calendar month. Her own week is excluded. */
  claimedElsewhereThisMonth: number;
  /** Null when no rate is in force - then nothing is claimable and we say so. */
  ratePerReport: number | null;
  /** claimed x rate. Shown on its own line, then added into the week total. */
  gross: number;
}

/**
 * A line of non-class work a teacher types on her own week.
 *
 * One of these per kind she has a rate for, and none at all for most people.
 * Not a role check and not a name: whether a rate is in force for this person
 * this week. Katie has admin hours; Jessica Price has tutoring sessions.
 */
export interface WeekWorkLine {
  kind: WeeklyWorkKind;
  quantity: number;
  rate: number;
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
  status: "open" | "submitted" | "approved" | "not_approved";
  /** What she wrote in the box above Submit. Empty when she had nothing to say. */
  teacherNote: string | null;
  /** Danni's reason when a week was not approved. Required to decline, optional to approve. */
  reviewNote: string | null;
  submittedAt: string | null;
  /** Set when the week cannot be shown. The screen prints this instead of a zero. */
  unavailable: string | null;
  /** True when this week begins before go-live and therefore does not exist. */
  beforeGoLive: boolean;
  /** GREATNESS Reports: its own line on the sheet, counted into `gross`. */
  greatness: WeekGreatness;
  /**
   * Non-class work she may claim: admin hours, tutoring sessions. Empty for
   * almost everyone, because almost nobody holds one of those rates.
   */
  workLines: WeekWorkLine[];
  /**
   * The campus a claim made on this week is FILED against.
   *
   * Not a gate on anything. contractor_work_claims.school_id is NOT NULL
   * (migration 377) because a cost has to land somewhere in the books, and on
   * 25 September Craig Mann - who teaches in both schools and therefore has no
   * single campus on his employee row - was told "your employee record has no
   * campus on it, so this cannot be saved". He had taught twenty-six children
   * that week; the platform knew exactly where.
   *
   * Taken from the classes she actually taught, which is migration 379's rule -
   * "pay follows the course's school, not the teacher's" - applied to the
   * claim that sits beside them. Null only when she taught nothing that could
   * be priced, and the action then falls back to her employee row.
   */
  claimSchoolId: string | null;
}

/** Nothing claimable, nothing claimed. The shape a week has before it is read. */
function noGreatness(weekStart: string): WeekGreatness {
  return {
    applies: greatnessAppliesTo(weekStart),
    claimed: 0,
    max: 0,
    distinctChildren: 0,
    claimedElsewhereThisMonth: 0,
    ratePerReport: null,
    gross: 0,
  };
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
    teacherNote: null,
    reviewNote: null,
    submittedAt: null,
    unavailable,
    beforeGoLive,
    greatness: noGreatness(weekStart),
    workLines: [],
    claimSchoolId: null,
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
        "instructor_employee_id, original_instructor_employee_id, " +
        "course_sections(section_code, start_time_et, courses(name))"
    )
    /* Hers, AND the ones somebody covered FOR her. A class that simply
       vanishes from a teacher's week when a colleague takes it is how she
       stops trusting the screen - she should see it, marked as covered, with
       no money against it. */
    .or(
      `instructor_employee_id.eq.${employeeId},original_instructor_employee_id.eq.${employeeId}`
    )
    .gte("scheduled_start", `${weekStart}T00:00:00`)
    .lte("scheduled_start", `${weekEnd}T23:59:59`)
    .order("scheduled_start", { ascending: true });

  if (sessionError) {
    return emptyWeek(employeeId, weekStart, `Could not read your classes: ${sessionError.message}`);
  }

  /* The pay calculator is the single source of what a class is worth - rate
     resolution, the roster on that day, the campus Friday cutoff. Calling it
     rather than recomputing keeps one answer in the system. */
  /* Her sessions only. This used to price all thirteen teachers inside one
     teacher's read permissions and keep a thirteenth of the answer. */
  const pay = await computeClassPay(supabase, weekStart, weekEnd, employeeId);
  if (pay.unavailable) {
    return emptyWeek(employeeId, weekStart, `Could not price your classes: ${pay.unavailable}`);
  }

  const paidBySession = new Map(
    pay.rows.filter((r) => r.employeeId === employeeId).map((r) => [r.sessionId, r])
  );

  /* Where her work happened, for anything that has to be filed against a
     campus. Her own priced classes only, and the first one is enough: a
     teacher working across two schools in one week files the claim at one of
     them, and either is truer than refusing to save it at all. */
  const claimSchoolId =
    pay.rows.find((r) => r.employeeId === employeeId && r.schoolId)?.schoolId ?? null;

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
        startsAtIso: String(raw.scheduled_start ?? ""),
        classDate,
        held,
        sessionStatus: status,
        coveredAway: String(raw.instructor_employee_id ?? "") !== employeeId,
        coveringFor:
          String(raw.instructor_employee_id ?? "") === employeeId &&
          Boolean(raw.original_instructor_employee_id),
        studentCount: priced?.studentCount ?? 0,
        /* present until somebody says otherwise - see the attendance read below */
        students: (priced?.studentIds ?? []).map((id) => ({ id, name: "", present: true })),
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

  /*
   * THE NAMES, IN ONE CALL, AND NEVER AT THE COST OF THE PAY.
   *
   * student_names_for_my_classes() returns a name and an id for children the
   * caller teaches, and nothing else - not the student row, which carries date
   * of birth, address and everything FERPA-classified, and which a teacher
   * still cannot read for a child at another school.
   *
   * One call for the whole week rather than one per class: a teacher has
   * fifteen classes and perhaps a dozen distinct children across them.
   *
   * IF IT FAILS, THE NAMES ARE MISSING AND THE PAY IS NOT. The count comes
   * from the pay calculator and is already decided; this only fills in who.
   * A screen that cannot name the children is worse than one that can, and far
   * better than one that cannot price them.
   */
  const idsInWeek = [...new Set(all.flatMap((c) => c.students.map((s) => s.id)))];
  if (idsInWeek.length > 0) {
    const { data: named } = await supabase.rpc("student_names_for_my_classes", {
      p_student_ids: idsInWeek,
    });
    const nameById = new Map(
      ((named ?? []) as { id: string; display_name: string }[]).map((r) => [
        r.id,
        r.display_name,
      ])
    );
    for (const c of all) {
      for (const child of c.students) {
        child.name = nameById.get(child.id) ?? "";
      }
      /* Alphabetical, so a teacher reads the same order every week and notices
         a missing name rather than re-reading the whole list. */
      c.students.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  /*
   * WHO WAS MARKED ABSENT.
   *
   * ABSENCE IS THE EXCEPTION. No row means the child was there: a teacher who
   * never opened a class has said nothing, and saying nothing has to mean the
   * ordinary thing happened. The opposite default would turn forgetting into a
   * mark against a child.
   *
   * One read for the whole week rather than one per class. If it fails, every
   * child reads as present - which is the same as an untouched week, and is the
   * safe direction to fail in.
   */
  const sessionIdsInWeek = all.map((c) => c.sessionId);
  if (sessionIdsInWeek.length > 0) {
    const { data: marks } = await supabase
      .from("session_attendance_records")
      .select("instructional_session_id, student_id, attendance_status")
      .in("instructional_session_id", sessionIdsInWeek);

    const absentKeys = new Set(
      ((marks ?? []) as Record<string, unknown>[])
        .filter((m) => String(m.attendance_status ?? "").startsWith("absent"))
        .map((m) => `${String(m.instructional_session_id)}:${String(m.student_id)}`)
    );

    if (absentKeys.size > 0) {
      for (const c of all) {
        for (const child of c.students) {
          if (absentKeys.has(`${c.sessionId}:${child.id}`)) child.present = false;
        }
      }
    }
  }

  /*
   * ── GREATNESS REPORTS ──────────────────────────────────────────────────────
   *
   * Read after the roster, because the ceiling is built from it: the distinct
   * children she taught in classes that were actually HELD. A class she did not
   * hold produced no child to write about, and a class somebody else covered
   * was not hers.
   *
   * Every read below is best effort. A GREATNESS line that cannot be built must
   * never take the class pay down with it - the same rule the names and the
   * absences already follow on this screen.
   */
  const heldOwnClasses = all.filter((c) => c.held && !c.coveredAway);
  const distinctChildren = new Set(
    heldOwnClasses.flatMap((c) => c.students.map((s) => s.id)).filter(Boolean)
  ).size;

  const monthStart = `${weekStart.slice(0, 7)}-01`;
  const monthEnd = (() => {
    const y = Number(weekStart.slice(0, 4));
    const m = Number(weekStart.slice(5, 7));
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    return `${next}-01`;
  })();

  let greatness = noGreatness(weekStart);

  if (greatness.applies) {
    const [{ data: claims, error: claimError }, { data: rateRows, error: rateError }] =
      await Promise.all([
        supabase
          .from("contractor_work_claims")
          .select("work_date, quantity")
          .eq("employee_id", employeeId)
          .eq("work_code", GREATNESS_WORK_CODE)
          .gte("work_date", monthStart)
          .lt("work_date", monthEnd),
        supabase
          .from("work_pay_rates")
          .select("code, label, unit, amount, employee_id, cadence_note, effective_from")
          .eq("code", GREATNESS_WORK_CODE),
      ]);

    /* Checked, not assumed. A refusal and an empty month look identical from
       here, and treating a refusal as "claimed nothing" would hand her back an
       allowance she has already spent. */
    if (claimError) {
      console.error("[teacher-week] greatness claims unreadable", claimError.message);
    }
    if (rateError) {
      console.error("[teacher-week] greatness rate unreadable", rateError.message);
    }

    const rows = ((claims ?? []) as { work_date: string; quantity: number }[]).map((r) => ({
      weekStart: String(r.work_date).slice(0, 10),
      quantity: Number(r.quantity) || 0,
    }));

    const claimed = rows
      .filter((r) => r.weekStart === weekStart)
      .reduce((n, r) => n + r.quantity, 0);
    const claimedElsewhereThisMonth = rows
      .filter((r) => r.weekStart !== weekStart)
      .reduce((n, r) => n + r.quantity, 0);

    const rate = workRateOn(
      ((rateRows ?? []) as Record<string, unknown>[]).map((r) => ({
        code: String(r.code),
        label: String(r.label),
        unit: String(r.unit) as WorkRate["unit"],
        amount: Number(r.amount),
        employeeId: (r.employee_id as string | null) ?? null,
        cadenceNote: (r.cadence_note as string | null) ?? null,
        effectiveFrom: String(r.effective_from),
      })),
      GREATNESS_WORK_CODE,
      employeeId,
      weekStart
    );

    greatness = {
      applies: true,
      claimed,
      /* Never below what she has already saved. A ceiling that drops under a
         figure already on the sheet reads as an accusation and gives her no
         way to act on it; the submit check is the thing that refuses. */
      max: Math.max(
        claimed,
        greatnessMaxFor({
          weekStart,
          distinctChildrenThisWeek: distinctChildren,
          claimedElsewhereThisMonth,
        })
      ),
      distinctChildren,
      claimedElsewhereThisMonth,
      ratePerReport: rate ? rate.amount : null,
      gross: rate ? greatnessGross(claimed, rate.amount) : 0,
    };
  }

  /*
   * ── WORK THAT IS NOT A CLASS ───────────────────────────────────────────────
   *
   * Admin hours, tutoring sessions. One read for the rates, one for the claims,
   * then a line for every kind this person actually has a rate for - which for
   * eleven of thirteen teachers is none, and the section never renders.
   *
   * Best effort, like everything else on this screen: a failure here costs the
   * extra lines and never the class pay.
   */
  const workLines: WeekWorkLine[] = [];

  {
    const codes = WEEKLY_WORK_KINDS.map((k) => k.code);

    const [{ data: workClaims, error: workClaimError }, { data: workRateRows, error: workRateError }] =
      await Promise.all([
        supabase
          .from("contractor_work_claims")
          .select("work_code, quantity")
          .eq("employee_id", employeeId)
          .eq("work_date", weekStart)
          .in("work_code", codes),
        supabase
          .from("work_pay_rates")
          .select("code, label, unit, amount, employee_id, cadence_note, effective_from")
          .in("code", codes),
      ]);

    if (workClaimError) {
      console.error("[teacher-week] work claims unreadable", workClaimError.message);
    }
    if (workRateError) {
      console.error("[teacher-week] work rates unreadable", workRateError.message);
    }

    const rates = ((workRateRows ?? []) as Record<string, unknown>[]).map((r) => ({
      code: String(r.code),
      label: String(r.label),
      unit: String(r.unit) as WorkRate["unit"],
      amount: Number(r.amount),
      employeeId: (r.employee_id as string | null) ?? null,
      cadenceNote: (r.cadence_note as string | null) ?? null,
      effectiveFrom: String(r.effective_from),
    }));

    for (const kind of WEEKLY_WORK_KINDS) {
      const rate = workRateOn(rates, kind.code, employeeId, weekStart);
      /* No rate is the whole gate. She does not hold this kind of work, so the
         question is never put to her. */
      if (!rate) continue;

      const quantity = ((workClaims ?? []) as { work_code: string; quantity: number }[])
        .filter((r) => r.work_code === kind.code)
        .reduce((n, r) => n + (Number(r.quantity) || 0), 0);

      workLines.push({
        kind,
        quantity,
        rate: rate.amount,
        gross: weeklyWorkGross(quantity, rate.amount),
      });
    }
  }

  const workGross =
    Math.round(workLines.reduce((sum, l) => sum + l.gross, 0) * 100) / 100;

  const { data: submission } = await supabase
    .from("teacher_week_submissions")
    .select("status, submitted_at, gross_cents, teacher_note, review_note")
    .eq("employee_id", employeeId)
    .eq("week_start", weekStart)
    .maybeSingle();

  /* SUBMITTED, APPROVED AND NOT APPROVED ARE ALL FROZEN. Review records a
     judgement about a figure; it does not reopen the figure. Only 'open' is
     editable, and a week Danni declined is still a week the teacher already
     signed - she amends it, she does not edit it. */
  const reviewed = ["submitted", "approved", "not_approved"];
  const submitted = reviewed.includes(String(submission?.status ?? ""));

  return {
    employeeId,
    weekStart,
    weekEnd,
    days,
    /* A class somebody else covered is neither taught nor not-taught by her.
       It is on her week so it does not vanish, and it is counted in neither
       column - counting it either way would be a claim she did not make. */
    classesHeld: all.filter((c) => c.held && !c.coveredAway).length,
    classesNotHeld: all.filter((c) => !c.held && !c.coveredAway).length,
    /* THE FROZEN FIGURE WINS ONCE SUBMITTED. A submitted week is a receipt, not
       a formula: recomputing it would let a later roster or rate change rewrite
       what the teacher verified and agreed to. */
    /* Classes plus GREATNESS Reports. The reports show as their own line on
       the screen and are counted once, here, into the figure she verifies and
       submits - Jimmy: "indicated as a separate number on their pay screen
       then added to their weekly total". */
    gross: submitted
      ? ((submission?.gross_cents as number | null) ?? 0) / 100
      : Math.round(
          (all.reduce((sum, c) => sum + c.gross, 0) +
            greatness.gross +
            workGross) *
            100
        ) / 100,
    status: (submitted
      ? (submission?.status as "submitted" | "approved" | "not_approved")
      : "open"),
    teacherNote: (submission?.teacher_note as string | null) ?? null,
    reviewNote: (submission?.review_note as string | null) ?? null,
    submittedAt: (submission?.submitted_at as string | null) ?? null,
    unavailable: null,
    beforeGoLive: false,
    greatness,
    workLines,
    claimSchoolId,
  };
}
