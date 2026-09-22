import { computeClassPay } from "@/lib/finance/class-pay";
import { formatClassTime, NETWORK_TIME_ZONE } from "@/lib/finance/teacher-week";

type AuthClient = Parameters<typeof computeClassPay>[0];

/**
 * The weeks waiting for Danni.
 *
 * WHY THIS LIVES UNDER /dashboard/finance. That route is guarded by
 * requireFinanceAccess(), which is FINANCE_ACCESS - so the guard IS the money
 * rule. Danni and Jimmy pass. Heather, a SCHOOL_LEADER stripped of money
 * permissions by migration 357, does not, which is exactly why review is
 * Danni's job and not hers.
 *
 * EASTERN, ALWAYS. Every time on this screen is read in the network's own
 * clock, not the reader's. A teacher sees her own timezone on her timesheet;
 * the person approving the money sees the one the deadline is measured in.
 */

export interface ReviewClass {
  sessionId: string;
  classDate: string;
  day: string;
  startsEt: string;
  courseName: string;
  sectionCode: string;
  studentNames: string[];
  studentCount: number;
  gross: number;
  isGuest: boolean;
}

export interface ReviewWeek {
  employeeId: string;
  teacherName: string;
  weekStart: string;
  weekEnd: string;
  status: "submitted" | "approved" | "not_approved";
  submittedAt: string | null;
  gross: number;
  sessionCount: number;
  unheldCount: number;
  teacherNote: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  classes: ReviewClass[];
}

const DAY_OF = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: NETWORK_TIME_ZONE,
    weekday: "short",
  }).format(new Date(`${iso}T12:00:00Z`));

/**
 * Every week that has been submitted, with the classes behind each figure.
 *
 * THE DETAIL IS THE POINT. Jimmy asked for "all their classes, kids, times,
 * days and amounts". A total on its own is not reviewable - approving a number
 * you cannot see behind is a rubber stamp, and the fault found on 21 September
 * was precisely a total that looked right and was not.
 */
export async function getWeeksAwaitingReview(
  supabase: AuthClient,
  options: { includeReviewed?: boolean } = {}
): Promise<{ weeks: ReviewWeek[]; unavailable: string | null }> {
  const statuses = options.includeReviewed
    ? ["submitted", "approved", "not_approved"]
    : ["submitted"];

  const { data: rows, error } = await supabase
    .from("teacher_week_submissions")
    .select(
      "employee_id, week_start, week_end, status, submitted_at, gross_cents, " +
        "session_count, unheld_count, teacher_note, review_note, reviewed_at"
    )
    .in("status", statuses)
    .order("week_start", { ascending: false });

  if (error) return { weeks: [], unavailable: error.message };
  if (!rows || rows.length === 0) return { weeks: [], unavailable: null };

  /* teacher_note, review_note and reviewed_at were added by migration 409 and
     are not in the generated database types yet, so the typed client cannot
     parse this select and collapses the row type to GenericStringError. Cast,
     the same way every other read in this file does, rather than let a
     type-generation lag block a shipped column. */
  const submissionRows = rows as unknown as Record<string, unknown>[];

  const employeeIds = [...new Set(submissionRows.map((r) => String(r.employee_id)))];

  const { data: profiles } = await supabase
    .from("employee_profiles")
    .select("employee_id, first_name, last_name, display_name")
    .in("employee_id", employeeIds);

  const nameByEmployee = new Map(
    ((profiles ?? []) as Record<string, unknown>[]).map((p) => [
      String(p.employee_id),
      (String(p.display_name ?? "").trim() ||
        `${String(p.first_name ?? "")} ${String(p.last_name ?? "")}`.trim() ||
        "Unnamed teacher") as string,
    ])
  );

  /* One pay run per distinct week rather than one per submission: thirteen
     teachers in the same week is one calculation, not thirteen. */
  const weekSpans = [
    ...new Map(
      submissionRows.map((r) => [
        `${String(r.week_start)}:${String(r.week_end)}`,
        { start: String(r.week_start), end: String(r.week_end) },
      ])
    ).values(),
  ];

  const payByWeek = new Map<string, Awaited<ReturnType<typeof computeClassPay>>>();
  for (const span of weekSpans) {
    payByWeek.set(span.start, await computeClassPay(supabase, span.start, span.end));
  }

  /* Names for every child on every class in play. Danni is EXECUTIVE_DIRECTOR,
     so can_access_student_record() lets her read them directly - she does not
     need the teacher-scoped function the timesheet uses. */
  const allStudentIds = [
    ...new Set(
      [...payByWeek.values()].flatMap((p) => p.rows.flatMap((r) => r.studentIds))
    ),
  ];

  const nameByStudent = new Map<string, string>();
  if (allStudentIds.length > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .in("id", allStudentIds);
    for (const s of (students ?? []) as Record<string, unknown>[]) {
      nameByStudent.set(
        String(s.id),
        `${String(s.first_name ?? "")} ${String(s.last_name ?? "")}`.trim() || "Unnamed student"
      );
    }
  }

  const weeks: ReviewWeek[] = submissionRows.map((r) => {
    const employeeId = String(r.employee_id);
    const weekStart = String(r.week_start);
    const pay = payByWeek.get(weekStart);

    const classes: ReviewClass[] = (pay?.rows ?? [])
      .filter((row) => row.employeeId === employeeId)
      .map((row) => ({
        sessionId: row.sessionId,
        classDate: row.classDate,
        day: DAY_OF(row.classDate),
        startsEt: formatClassTime(`${row.classDate}T12:00:00Z`, NETWORK_TIME_ZONE),
        courseName: row.courseName,
        sectionCode: row.sectionCode,
        studentNames: row.studentIds
          .map((id) => nameByStudent.get(id) ?? "")
          .filter(Boolean),
        studentCount: row.studentCount,
        gross: row.gross,
        isGuest: row.isGuest,
      }))
      .sort((a, b) => a.classDate.localeCompare(b.classDate));

    return {
      employeeId,
      teacherName: nameByEmployee.get(employeeId) ?? "Unnamed teacher",
      weekStart,
      weekEnd: String(r.week_end),
      status: String(r.status) as ReviewWeek["status"],
      submittedAt: (r.submitted_at as string | null) ?? null,
      gross: ((r.gross_cents as number | null) ?? 0) / 100,
      sessionCount: (r.session_count as number | null) ?? 0,
      unheldCount: (r.unheld_count as number | null) ?? 0,
      teacherNote: (r.teacher_note as string | null) ?? null,
      reviewNote: (r.review_note as string | null) ?? null,
      reviewedAt: (r.reviewed_at as string | null) ?? null,
      classes,
    };
  });

  return { weeks, unavailable: null };
}

export interface MissingTeacher {
  employeeId: string;
  teacherName: string;
  scheduledClasses: number;
}

export interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  submittedCount: number;
  approvedCount: number;
  notApprovedCount: number;
  awaitingCount: number;
  /** Total of every submitted week, whatever its review state. */
  grossTotal: number;
  /** Of that total, the part Danni has approved. */
  approvedTotal: number;
  /** Teachers who taught this week and have not submitted. */
  notSubmitted: MissingTeacher[];
}

/**
 * One week, across everybody.
 *
 * WHO HAS NOT SUBMITTED IS THE POINT OF THIS. A summary of the weeks that
 * arrived tells you what you are about to pay. It does not tell you about the
 * teacher who taught fifteen classes and went quiet, and she is the one who
 * ends up unpaid. So the absences are computed from the SCHEDULE - anybody
 * with a class this week and no submission - rather than from the submissions,
 * which by definition cannot show you what is missing.
 *
 * The same reasoning as everything else found this week: a screen that can only
 * show you what is there will never show you what is not.
 */
export async function getTimesheetWeekSummary(
  supabase: AuthClient,
  weekStart: string,
  weekEnd: string
): Promise<{ summary: WeekSummary | null; unavailable: string | null }> {
  const { data: rows, error } = await supabase
    .from("teacher_week_submissions")
    .select("employee_id, status, gross_cents")
    .eq("week_start", weekStart);

  if (error) return { summary: null, unavailable: error.message };

  const submissions = (rows ?? []) as Record<string, unknown>[];
  const submittedEmployeeIds = new Set(submissions.map((r) => String(r.employee_id)));

  const totalOf = (predicate: (status: string) => boolean) =>
    Math.round(
      submissions
        .filter((r) => predicate(String(r.status)))
        .reduce((sum, r) => sum + ((r.gross_cents as number | null) ?? 0), 0)
    ) / 100;

  /* Everyone who actually has a class this week, from the schedule. */
  const { data: taught } = await supabase
    .from("instructional_sessions")
    .select("instructor_employee_id")
    .gte("scheduled_start", `${weekStart}T00:00:00`)
    .lte("scheduled_start", `${weekEnd}T23:59:59`);

  const classesByEmployee = new Map<string, number>();
  for (const row of (taught ?? []) as Record<string, unknown>[]) {
    const id = String(row.instructor_employee_id ?? "");
    if (!id) continue;
    classesByEmployee.set(id, (classesByEmployee.get(id) ?? 0) + 1);
  }

  const missingIds = [...classesByEmployee.keys()].filter(
    (id) => !submittedEmployeeIds.has(id)
  );

  const nameByEmployee = new Map<string, string>();
  if (missingIds.length > 0) {
    const { data: profiles } = await supabase
      .from("employee_profiles")
      .select("employee_id, first_name, last_name, display_name")
      .in("employee_id", missingIds);
    for (const p of (profiles ?? []) as Record<string, unknown>[]) {
      nameByEmployee.set(
        String(p.employee_id),
        String(p.display_name ?? "").trim() ||
          `${String(p.first_name ?? "")} ${String(p.last_name ?? "")}`.trim() ||
          "Unnamed teacher"
      );
    }
  }

  return {
    summary: {
      weekStart,
      weekEnd,
      submittedCount: submissions.length,
      approvedCount: submissions.filter((r) => String(r.status) === "approved").length,
      notApprovedCount: submissions.filter((r) => String(r.status) === "not_approved").length,
      awaitingCount: submissions.filter((r) => String(r.status) === "submitted").length,
      grossTotal: totalOf(() => true),
      approvedTotal: totalOf((s) => s === "approved"),
      notSubmitted: missingIds
        .map((id) => ({
          employeeId: id,
          teacherName: nameByEmployee.get(id) ?? "Unnamed teacher",
          scheduledClasses: classesByEmployee.get(id) ?? 0,
        }))
        .sort((a, b) => a.teacherName.localeCompare(b.teacherName)),
    },
    unavailable: null,
  };
}
