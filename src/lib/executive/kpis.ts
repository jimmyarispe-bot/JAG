/**
 * Sprint 003 — Executive Intelligence live KPI queries.
 * Returns zeros (not placeholders) when data is unavailable.
 */
import { ACTIVE_PIPELINE_LEGACY_STAGES } from "@/lib/admissions/registry";
import {
  applySchoolFilter,
  hasNoSchoolAccess,
  matchesSchool,
  resolveDashboardSchoolScope,
  type SchoolScope,
} from "@/lib/dashboard/school-scope";
import { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const PRESENT_STATUSES = new Set([
  "present",
  "tardy",
  "early_dismissal",
  "virtual_present",
  "therapy_present",
]);

const DEFAULT_ATTENDANCE_WARNING = 90;
const DEFAULT_ENROLLMENT_FLOOR = 1;

export type ExecutiveAlertType =
  | "overdue_payroll"
  | "overdue_invoices"
  | "enrollment_below_threshold"
  | "attendance_below_threshold"
  | "missing_staffing"
  | "failed_integrations";

export interface ExecutiveUpcomingClass {
  id: string;
  courseName: string;
  sectionCode: string;
  scheduledStart: string;
  deliveryMode: string | null;
}

export interface ExecutiveKpiAlert {
  id: string;
  type: ExecutiveAlertType;
  title: string;
  body: string;
  severity: "critical" | "high" | "medium" | "low";
  count: number;
}

export interface AdmissionsStageCount {
  stage: string;
  count: number;
}

export interface TeacherAttendanceKpi {
  /** Today's submitted attendance % (0–100). */
  submittedPct: number;
  /** Today's missing attendance % (0–100). */
  missingPct: number;
  submitted: number;
  total: number;
}

export interface StudentAttendanceKpi {
  /** Today's attendance % (0–100). */
  rate: number;
  absentCount: number;
  unsubmittedClassrooms: number;
  present: number;
  total: number;
}

export interface ExecutiveKPIs {
  enrollment: number;
  admissions: number;
  /** Active admissions leads grouped by lead_stage. */
  admissionsByStage: AdmissionsStageCount[];
  revenue: number;
  outstanding: number;
  staff: number;
  /** Today's teacher attendance submission rate (0–100). */
  teacherAttendance: number;
  teacherAttendanceDetail: TeacherAttendanceKpi;
  /** Today's student attendance rate (0–100). */
  studentAttendance: number;
  studentAttendanceDetail: StudentAttendanceKpi;
  upcomingClasses: ExecutiveUpcomingClass[];
  alerts: ExecutiveKpiAlert[];
}

export interface GetExecutiveKPIsOptions {
  /** Limit school scope. When omitted, uses Founder identity access. */
  schoolIds?: string[];
  supabase?: AuthClient;
}

function emptyTeacherAttendance(): TeacherAttendanceKpi {
  return { submittedPct: 0, missingPct: 0, submitted: 0, total: 0 };
}

function emptyStudentAttendance(): StudentAttendanceKpi {
  return { rate: 0, absentCount: 0, unsubmittedClassrooms: 0, present: 0, total: 0 };
}

function emptyKPIs(): ExecutiveKPIs {
  return {
    enrollment: 0,
    admissions: 0,
    admissionsByStage: [],
    revenue: 0,
    outstanding: 0,
    staff: 0,
    teacherAttendance: 0,
    teacherAttendanceDetail: emptyTeacherAttendance(),
    studentAttendance: 0,
    studentAttendanceDetail: emptyStudentAttendance(),
    upcomingClasses: [],
    alerts: [],
  };
}

function monthStartIso(): string {
  const monthStart = new Date();
  monthStart.setDate(1);
  return monthStart.toISOString().split("T")[0];
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function todayRange(): { start: string; end: string } {
  const t = todayIso();
  return { start: `${t}T00:00:00`, end: `${t}T23:59:59` };
}

async function resolveSchoolScope(
  supabase: AuthClient,
  options: GetExecutiveKPIsOptions
): Promise<SchoolScope> {
  return resolveDashboardSchoolScope(supabase, { schoolIds: options.schoolIds });
}

/** Active course-section enrollments (matches Founder "Active Enrollment" card). */
async function countActiveEnrollments(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  let query = supabase
    .from("student_enrollments")
    .select("id, students!inner(school_id)", { count: "exact", head: true })
    .eq("enrollment_status", "enrolled");

  if (schoolIds?.length === 1) {
    query = query.eq("students.school_id", schoolIds[0]);
  } else if (schoolIds && schoolIds.length > 1) {
    query = query.in("students.school_id", schoolIds);
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function loadAdmissionsPipeline(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<{ total: number; byStage: AdmissionsStageCount[] }> {
  if (hasNoSchoolAccess(schoolIds)) return { total: 0, byStage: [] };

  let query = supabase
    .from("admissions_leads")
    .select("lead_stage, school_id")
    .in("lead_stage", [...ACTIVE_PIPELINE_LEGACY_STAGES]);
  query = applySchoolFilter(query, "school_id", schoolIds);

  const { data, error } = await query;
  if (error || !data) return { total: 0, byStage: [] };

  const counts = new Map<string, number>();
  for (const row of data) {
    const stage = row.lead_stage || "unknown";
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  const byStage = [...counts.entries()]
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  return { total: data.length, byStage };
}

/** Resolve billing accounts in scope so invoice/payment queries stay school-bound. */
async function billingAccountIdsForSchools(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<string[] | null> {
  if (!schoolIds) return null;
  if (schoolIds.length === 0) return [];
  let query = supabase.from("family_billing_accounts").select("id");
  query = applySchoolFilter(query, "school_id", schoolIds);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map((row) => row.id);
}

async function sumMonthlyRevenue(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  const accountIds = await billingAccountIdsForSchools(supabase, schoolIds);
  if (accountIds && accountIds.length === 0) return 0;

  let query = supabase
    .from("payments")
    .select("amount, invoices!inner(billing_account_id)")
    .gte("paid_at", monthStartIso());

  if (accountIds) {
    query = query.in("invoices.billing_account_id", accountIds);
  }

  const { data, error } = await query;
  if (error || !data) return 0;

  return data.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
}

async function sumOutstandingTuition(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  const accountIds = await billingAccountIdsForSchools(supabase, schoolIds);
  if (accountIds && accountIds.length === 0) return 0;

  let query = supabase
    .from("invoices")
    .select("total_amount, amount_paid, invoice_status, billing_account_id")
    .not("invoice_status", "in", '("paid","void")');

  if (accountIds) {
    query = query.in("billing_account_id", accountIds);
  }

  const { data, error } = await query;
  if (error || !data) return 0;

  return data.reduce(
    (sum, inv) => sum + (Number(inv.total_amount ?? 0) - Number(inv.amount_paid ?? 0)),
    0
  );
}

async function countActiveStaff(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  let query = supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("employment_status", "active");
  query = applySchoolFilter(query, "school_id", schoolIds);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function loadTodaySessions(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<{ id: string }[]> {
  if (hasNoSchoolAccess(schoolIds)) return [];

  const { start, end } = todayRange();

  // Scope sections to schools first — avoid loading all org sessions then filtering.
  let sectionIds: string[] | null = null;
  if (schoolIds) {
    let coursesQuery = supabase.from("courses").select("id");
    coursesQuery = applySchoolFilter(coursesQuery, "school_id", schoolIds);
    const { data: courses } = await coursesQuery;
    const courseIds = (courses ?? []).map((c) => c.id);
    if (!courseIds.length) return [];
    const { data: sections } = await supabase
      .from("course_sections")
      .select("id")
      .in("course_id", courseIds);
    sectionIds = (sections ?? []).map((s) => s.id);
    if (!sectionIds.length) return [];
  }

  let query = supabase
    .from("instructional_sessions")
    .select("id")
    .gte("scheduled_start", start)
    .lte("scheduled_start", end)
    .in("session_status", ["scheduled", "in_progress", "completed"]);

  if (sectionIds) {
    query = query.in("course_section_id", sectionIds);
  }

  const { data } = await query;
  return (data ?? []).map((s) => ({ id: s.id }));
}

async function loadTeacherAttendance(
  supabase: AuthClient,
  schoolIds: SchoolScope,
  todaySessions?: { id: string }[]
): Promise<TeacherAttendanceKpi> {
  const sessions = todaySessions ?? (await loadTodaySessions(supabase, schoolIds));
  if (!sessions.length) return emptyTeacherAttendance();

  const sessionIds = sessions.map((s) => s.id);
  const { data: attendanceRows } = await supabase
    .from("session_attendance_records")
    .select("instructional_session_id")
    .in("instructional_session_id", sessionIds);

  const submittedIds = new Set(
    (attendanceRows ?? []).map((row) => row.instructional_session_id)
  );
  const submitted = sessions.filter((s) => submittedIds.has(s.id)).length;
  const total = sessions.length;
  const submittedPct = total ? Math.round((submitted / total) * 100) : 0;
  const missingPct = total ? Math.round(((total - submitted) / total) * 100) : 0;

  return { submittedPct, missingPct, submitted, total };
}

async function loadStudentAttendance(
  supabase: AuthClient,
  schoolIds: SchoolScope,
  unsubmittedClassrooms: number
): Promise<StudentAttendanceKpi> {
  if (hasNoSchoolAccess(schoolIds)) {
    return {
      rate: 0,
      absentCount: 0,
      unsubmittedClassrooms,
      present: 0,
      total: 0,
    };
  }

  const date = todayIso();
  const { data } = await supabase
    .from("student_attendance_records")
    .select("status, students(school_id)")
    .eq("attendance_date", date);

  const records = (data ?? []).filter((record) => {
    if (!schoolIds) return true;
    const student = Array.isArray(record.students) ? record.students[0] : record.students;
    return matchesSchool(schoolIds, (student as { school_id?: string } | null)?.school_id);
  });

  if (!records.length) {
    return {
      rate: 0,
      absentCount: 0,
      unsubmittedClassrooms,
      present: 0,
      total: 0,
    };
  }

  const present = records.filter((r) => PRESENT_STATUSES.has(r.status)).length;
  const absentCount = records.length - present;
  const rate = Math.round((present / records.length) * 100);

  return { rate, absentCount, unsubmittedClassrooms, present, total: records.length };
}

async function loadUpcomingClasses(
  supabase: AuthClient,
  schoolIds: SchoolScope,
  limit = 5
): Promise<ExecutiveUpcomingClass[]> {
  if (hasNoSchoolAccess(schoolIds)) return [];

  const { data } = await supabase
    .from("instructional_sessions")
    .select(
      "id, scheduled_start, course_sections(section_code, delivery_mode, courses(name, school_id))"
    )
    .gte("scheduled_start", new Date().toISOString())
    .eq("session_status", "scheduled")
    .order("scheduled_start")
    .limit(limit * 3);

  return (data ?? [])
    .filter((session) => {
      if (!schoolIds) return true;
      const section = Array.isArray(session.course_sections)
        ? session.course_sections[0]
        : session.course_sections;
      const course = Array.isArray(section?.courses) ? section?.courses[0] : section?.courses;
      return matchesSchool(schoolIds, (course as { school_id?: string } | null)?.school_id);
    })
    .slice(0, limit)
    .map((session) => {
      const section = Array.isArray(session.course_sections)
        ? session.course_sections[0]
        : session.course_sections;
      const course = Array.isArray(section?.courses) ? section?.courses[0] : section?.courses;
      return {
        id: session.id,
        courseName: (course as { name?: string } | null)?.name ?? "Class session",
        sectionCode: (section as { section_code?: string } | null)?.section_code ?? "—",
        scheduledStart: session.scheduled_start,
        deliveryMode: (section as { delivery_mode?: string } | null)?.delivery_mode ?? null,
      };
    });
}

async function countOverduePayroll(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  let query = supabase
    .from("payroll_records")
    .select("id", { count: "exact", head: true })
    .in("pay_status", ["pending", "approved"])
    .lt("pay_period_end", todayIso());
  query = applySchoolFilter(query, "school_id", schoolIds);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function countOverdueInvoices(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  const today = todayIso();
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_status, due_date, family_billing_accounts(school_id)");

  if (error || !data) return 0;

  return data.filter((inv) => {
    if (["paid", "void"].includes(inv.invoice_status)) return false;
    if (schoolIds) {
      const account = Array.isArray(inv.family_billing_accounts)
        ? inv.family_billing_accounts[0]
        : inv.family_billing_accounts;
      if (!matchesSchool(schoolIds, (account as { school_id?: string } | null)?.school_id)) {
        return false;
      }
    }
    return inv.invoice_status === "overdue" || inv.due_date < today;
  }).length;
}

async function countOpenVacancies(
  supabase: AuthClient,
  schoolIds: SchoolScope
): Promise<number> {
  if (hasNoSchoolAccess(schoolIds)) return 0;

  let query = supabase
    .from("hr_job_postings")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  query = applySchoolFilter(query, "school_id", schoolIds);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function countFailedIntegrations(supabase: AuthClient): Promise<number> {
  const [connectors, syncJobs] = await Promise.all([
    supabase
      .from("edp_connector_instances")
      .select("id", { count: "exact", head: true })
      .in("health_status", ["unhealthy", "degraded"]),
    supabase
      .from("edp_sync_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
  ]);

  return (connectors.count ?? 0) + (syncJobs.count ?? 0);
}

async function loadThresholds(supabase: AuthClient): Promise<{
  attendanceWarning: number;
  enrollmentFloor: number;
}> {
  const { data } = await supabase
    .from("executive_kpi_definitions")
    .select("kpi_key, warning_threshold, critical_threshold, target_value")
    .in("kpi_key", ["attendance_rate", "enrollment_growth", "enrollment.active_students"])
    .eq("is_active", true);

  const attendance = (data ?? []).find((d) => d.kpi_key === "attendance_rate");
  const enrollment = (data ?? []).find(
    (d) => d.kpi_key === "enrollment_growth" || d.kpi_key === "enrollment.active_students"
  );

  let enrollmentFloor = DEFAULT_ENROLLMENT_FLOOR;
  const { data: snaps } = await supabase
    .from("executive_kpi_snapshots")
    .select("target_value, actual_value, prior_period_value")
    .in("kpi_key", [
      "enrollment.active_enrollments",
      "enrollment.active_students",
      "enrollment_growth",
    ])
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const snap = snaps?.[0];
  if (snap?.target_value != null && Number(snap.target_value) > 0) {
    enrollmentFloor = Number(snap.target_value);
  } else if (snap?.prior_period_value != null && Number(snap.prior_period_value) > 0) {
    enrollmentFloor = Math.round(Number(snap.prior_period_value) * 0.9);
  } else if (enrollment?.target_value != null && Number(enrollment.target_value) > 10) {
    // Absolute headcount targets only (ignore percent growth targets like 5).
    enrollmentFloor = Number(enrollment.target_value);
  }

  return {
    attendanceWarning:
      attendance?.warning_threshold != null
        ? Number(attendance.warning_threshold)
        : DEFAULT_ATTENDANCE_WARNING,
    enrollmentFloor,
  };
}

function buildAlerts(input: {
  overduePayroll: number;
  overdueInvoices: number;
  enrollment: number;
  enrollmentFloor: number;
  studentAttendanceRate: number;
  attendanceWarning: number;
  vacancies: number;
  failedIntegrations: number;
}): ExecutiveKpiAlert[] {
  const alerts: ExecutiveKpiAlert[] = [];

  if (input.overduePayroll > 0) {
    alerts.push({
      id: "overdue_payroll",
      type: "overdue_payroll",
      title: "Overdue payroll",
      body: `${input.overduePayroll} payroll record(s) past pay period end are still unpaid.`,
      severity: input.overduePayroll >= 5 ? "critical" : "high",
      count: input.overduePayroll,
    });
  }

  if (input.overdueInvoices > 0) {
    alerts.push({
      id: "overdue_invoices",
      type: "overdue_invoices",
      title: "Overdue invoices",
      body: `${input.overdueInvoices} invoice(s) are past due.`,
      severity: input.overdueInvoices >= 10 ? "critical" : "high",
      count: input.overdueInvoices,
    });
  }

  if (input.enrollment < input.enrollmentFloor) {
    alerts.push({
      id: "enrollment_below_threshold",
      type: "enrollment_below_threshold",
      title: "Enrollment below threshold",
      body: `Active enrollment is ${input.enrollment} (threshold ${input.enrollmentFloor}).`,
      severity: input.enrollment === 0 ? "critical" : "high",
      count: input.enrollment,
    });
  }

  if (input.studentAttendanceRate > 0 && input.studentAttendanceRate < input.attendanceWarning) {
    alerts.push({
      id: "attendance_below_threshold",
      type: "attendance_below_threshold",
      title: "Attendance below threshold",
      body: `Today's student attendance is ${input.studentAttendanceRate}% (threshold ${input.attendanceWarning}%).`,
      severity: input.studentAttendanceRate < 85 ? "critical" : "high",
      count: input.studentAttendanceRate,
    });
  }

  if (input.vacancies > 0) {
    alerts.push({
      id: "missing_staffing",
      type: "missing_staffing",
      title: "Missing staffing",
      body: `${input.vacancies} open job posting(s) need coverage.`,
      severity: input.vacancies >= 5 ? "critical" : "medium",
      count: input.vacancies,
    });
  }

  if (input.failedIntegrations > 0) {
    alerts.push({
      id: "failed_integrations",
      type: "failed_integrations",
      title: "Failed integrations",
      body: `${input.failedIntegrations} connector health issue(s) or failed sync job(s).`,
      severity: input.failedIntegrations >= 3 ? "critical" : "high",
      count: input.failedIntegrations,
    });
  }

  return alerts;
}

/**
 * Load live Executive KPIs from Supabase for schools the Founder can access.
 * Never returns placeholder text — unavailable metrics are zero / empty arrays.
 */
export async function getExecutiveKPIs(
  options: GetExecutiveKPIsOptions = {}
): Promise<ExecutiveKPIs> {
  try {
    const supabase = options.supabase ?? (await createAuthClient());
    const schoolIds = await resolveSchoolScope(supabase, options);

    const todaySessions = await loadTodaySessions(supabase, schoolIds).catch(() => []);

    const [
      enrollment,
      admissions,
      revenue,
      outstanding,
      staff,
      teacherAttendanceDetail,
      upcomingClasses,
      overduePayroll,
      overdueInvoices,
      vacancies,
      failedIntegrations,
      thresholds,
    ] = await Promise.all([
      countActiveEnrollments(supabase, schoolIds).catch(() => 0),
      loadAdmissionsPipeline(supabase, schoolIds).catch(() => ({
        total: 0,
        byStage: [] as AdmissionsStageCount[],
      })),
      sumMonthlyRevenue(supabase, schoolIds).catch(() => 0),
      sumOutstandingTuition(supabase, schoolIds).catch(() => 0),
      countActiveStaff(supabase, schoolIds).catch(() => 0),
      loadTeacherAttendance(supabase, schoolIds, todaySessions).catch(() =>
        emptyTeacherAttendance()
      ),
      loadUpcomingClasses(supabase, schoolIds).catch(() => [] as ExecutiveUpcomingClass[]),
      countOverduePayroll(supabase, schoolIds).catch(() => 0),
      countOverdueInvoices(supabase, schoolIds).catch(() => 0),
      countOpenVacancies(supabase, schoolIds).catch(() => 0),
      countFailedIntegrations(supabase).catch(() => 0),
      loadThresholds(supabase).catch(() => ({
        attendanceWarning: DEFAULT_ATTENDANCE_WARNING,
        enrollmentFloor: DEFAULT_ENROLLMENT_FLOOR,
      })),
    ]);

    const unsubmittedClassrooms = Math.max(
      0,
      teacherAttendanceDetail.total - teacherAttendanceDetail.submitted
    );

    const studentAttendanceDetail = await loadStudentAttendance(
      supabase,
      schoolIds,
      unsubmittedClassrooms
    ).catch(() => emptyStudentAttendance());

    const alerts = buildAlerts({
      overduePayroll,
      overdueInvoices,
      enrollment,
      enrollmentFloor: thresholds.enrollmentFloor,
      studentAttendanceRate: studentAttendanceDetail.rate,
      attendanceWarning: thresholds.attendanceWarning,
      vacancies,
      failedIntegrations,
    });

    return {
      enrollment,
      admissions: admissions.total,
      admissionsByStage: admissions.byStage,
      revenue,
      outstanding,
      staff,
      teacherAttendance: teacherAttendanceDetail.submittedPct,
      teacherAttendanceDetail,
      studentAttendance: studentAttendanceDetail.rate,
      studentAttendanceDetail,
      upcomingClasses,
      alerts,
    };
  } catch {
    return emptyKPIs();
  }
}
