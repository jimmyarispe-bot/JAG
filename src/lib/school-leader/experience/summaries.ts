/**
 * Domain summaries for School Leader screens — thin wrappers over existing services.
 */

import { createLearningIntelligenceEngine } from "@learning-intelligence";
import { buildLearningProgressSummary } from "@academyos";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getExecutiveAdmissionsMetrics } from "@/lib/admissions/executive-metrics";
import { getSchedulingCapacityReport } from "@/lib/scheduling/queries";
import { getStudents, getStudentStats } from "@/lib/students/queries";
import {
  getEmployees,
  getPositions,
  computeHrStats,
} from "@/lib/hr/queries";
import { getWorkforceAnalytics, getOrgChart } from "@/lib/hr/analytics";
import { getRecruitingPipeline, getComplianceCenter } from "@/lib/hr/employee-profile";
import {
  getScheduleConflicts,
  getSchedulingExecutiveStats,
  getStaffWorkload,
} from "@/lib/scheduling/queries";
import { getExecutiveDeadlineAnalytics } from "@/lib/compliance/deadlines";
import { getFinanceOperationsSummary } from "@/lib/finance-platform/reports";
import { listAnnouncements } from "@/lib/communications/announcements";
import { listCommunications } from "@/lib/communications/queries";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getSchoolLeaderEnrollmentSummary(schoolId: string | null) {
  const [metrics, capacity] = await Promise.all([
    getExecutiveAdmissionsMetrics(),
    schoolId
      ? getSchedulingCapacityReport(schoolId).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    pipeline: {
      newInquiries: metrics.newInquiries,
      activeLeads: metrics.activeLeads,
      applicationsStarted: metrics.applicationsStarted,
      applicationsSubmitted: metrics.applicationsSubmitted,
      awaitingDocuments: metrics.awaitingDocuments,
      awaitingDecision: metrics.awaitingDecision,
      accepted: metrics.accepted,
      waitlisted: metrics.waitlisted,
      enrolled: metrics.funnel.find((f) => f.stepId === "enrolled")?.count ?? 0,
      declined: metrics.declined,
    },
    capacity,
    trendsNote:
      "Enrollment trends and capacity come from Admissions executive metrics and Scheduling capacity — no duplicated funnel math.",
  };
}

export async function getSchoolLeaderStudentsSummary(opts?: {
  query?: string;
  status?: "active" | "all" | "archived";
}) {
  const [stats, students] = await Promise.all([
    getStudentStats(),
    getStudents(opts?.status ?? "active"),
  ]);

  const needle = (opts?.query ?? "").trim().toLowerCase();
  const filtered = needle
    ? students.filter((s) => {
        const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase();
        return (
          name.includes(needle) ||
          String(s.id).toLowerCase().includes(needle) ||
          String(s.enrollment_status ?? "").toLowerCase().includes(needle)
        );
      })
    : students;

  const flagged = filtered.slice(0, 40).map((s) => {
    const funding = Array.isArray(s.funding_sources) ? s.funding_sources : [];
    const hasIep = funding.some((f) => /iep|504|special/i.test(String(f)));
    return {
      id: s.id as string,
      name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "Student",
      enrollmentStatus: s.enrollment_status,
      status: s.status,
      href: `/dashboard/students/${s.id}`,
      iepOr504: hasIep,
      attendanceAlert: false,
      academicAlert: false,
      interventionFlag: false,
    };
  });

  return { stats, students: flagged, totalMatched: filtered.length };
}

export async function getSchoolLeaderTeachersSummary(
  supabase: AuthClient,
  schoolId: string | null
) {
  const [employees, positions, analytics] = await Promise.all([
    getEmployees(),
    getPositions(),
    getWorkforceAnalytics(supabase, schoolId ?? undefined).catch(() => null),
  ]);

  const teachers = employees
    .filter((e) => e.employment_status === "active")
    .slice(0, 50)
    .map((e) => {
      const profile = e.employee_profiles;
      const name =
        profile?.display_name ||
        `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
        "Employee";
      return {
        id: e.id,
        name,
        schoolId: e.school_id,
        status: e.employment_status,
        title: profile?.job_title ?? null,
      };
    });

  let workload: Awaited<ReturnType<typeof getStaffWorkload>> = [];
  if (schoolId) {
    try {
      workload = await getStaffWorkload(schoolId);
    } catch {
      workload = [];
    }
  }

  return {
    teachers,
    openPositions: positions.filter((p) => p.status === "active").slice(0, 20),
    workload: workload.slice(0, 30),
    analytics,
    note: "Teacher roster, workload, and vacancies come from HR + Scheduling — no duplicated staffing math.",
  };
}

export async function getSchoolLeaderAcademicsSummary(organizationId: string) {
  let liSummary: ReturnType<typeof buildLearningProgressSummary> | null = null;
  let distribution: unknown = null;
  let interventions: unknown[] = [];

  try {
    liSummary = buildLearningProgressSummary(organizationId);
  } catch {
    liSummary = null;
  }

  try {
    const engine = createLearningIntelligenceEngine();
    distribution = engine.masteryDistribution(organizationId);
    const listed = engine.listInterventions(organizationId) as unknown[];
    interventions = listed.slice(0, 15);
  } catch {
    distribution = null;
    interventions = [];
  }

  return {
    progress: liSummary,
    masteryDistribution: distribution,
    interventions,
    source: "LearningIntelligenceEngine" as const,
    note: "Academic oversight is read-only Learning Intelligence / AcademyOS learning summaries — no duplicated mastery calculations.",
  };
}

export async function getSchoolLeaderSchedulingSummary(schoolId: string | null) {
  const [stats, conflicts] = await Promise.all([
    getSchedulingExecutiveStats(schoolId ?? undefined),
    getScheduleConflicts(schoolId ?? undefined),
  ]);

  return {
    stats,
    conflicts: conflicts.slice(0, 25),
    calendarHref: "/dashboard/calendar",
    schedulingHref: "/dashboard/scheduling",
    note: "Classes, conflicts, and coverage from existing Scheduling services.",
  };
}

export async function getSchoolLeaderComplianceSummary(
  supabase: AuthClient,
  schoolId: string | null
) {
  const [analytics, hrCompliance] = await Promise.all([
    getExecutiveDeadlineAnalytics(supabase, schoolId ?? undefined),
    getComplianceCenter(supabase, schoolId ?? undefined).catch(() => null),
  ]);

  return {
    analytics,
    hrCompliance,
    checklistHref: "/dashboard/compliance",
    note: "Attendance/docs/training/IEP reminders via Compliance deadlines + HR compliance center.",
  };
}

export async function getSchoolLeaderFinanceSummary(
  supabase: AuthClient,
  schoolId: string | null
) {
  const summary = await getFinanceOperationsSummary(supabase, { schoolId });
  return {
    summary,
    readOnly: true as const,
    engines: ["FinanceEngine", "ChiefFinancialOfficerEngine"] as const,
    note: "Read-only operational summaries — no accounting or payroll logic in this workspace.",
    deepLinks: {
      finance: "/dashboard/finance",
      scholarships: "/dashboard/scholarships",
    },
  };
}

export async function getSchoolLeaderHrSummary(
  supabase: AuthClient,
  schoolId: string | null
) {
  const [employees, positions, pipeline, orgChart, analytics] = await Promise.all([
    getEmployees(),
    getPositions(),
    getRecruitingPipeline(supabase, schoolId ?? undefined).catch(() => null),
    schoolId ? getOrgChart(supabase, schoolId).catch(() => null) : Promise.resolve(null),
    getWorkforceAnalytics(supabase, schoolId ?? undefined).catch(() => null),
  ]);

  const stats = computeHrStats(employees, [], []);

  return {
    stats,
    openPositions: positions.filter((p) => p.status === "active").slice(0, 20),
    pipeline,
    orgChart,
    analytics,
    deepLink: "/dashboard/hr",
    note: "Open positions, applicants, and training compliance from existing HR services.",
  };
}

export async function getSchoolLeaderCommunicationsSummary(
  supabase: AuthClient,
  schoolId: string | null
) {
  const [announcements, communications] = await Promise.all([
    listAnnouncements(supabase, { schoolId, limit: 20 }),
    listCommunications({ schoolId: schoolId ?? undefined, pageSize: 20 }).catch(() => ({
      rows: [],
      total: 0,
    })),
  ]);

  return {
    announcements,
    communications: communications.rows ?? [],
    deepLink: "/dashboard/communications",
  };
}

export function getSchoolLeaderReportsCatalog() {
  return [
    {
      id: "enrollment",
      title: "Enrollment",
      href: "/dashboard/admissions",
      description: "Pipeline and acceptance reporting via Admissions",
    },
    {
      id: "attendance",
      title: "Attendance / operations",
      href: "/dashboard/scheduling",
      description: "Session and conflict reporting via Scheduling",
    },
    {
      id: "academics",
      title: "Academics",
      href: "/dashboard/school-leader/academics",
      description: "Learning Intelligence org summaries",
    },
    {
      id: "compliance",
      title: "Compliance",
      href: "/dashboard/compliance",
      description: "Obligations and deadline analytics",
    },
    {
      id: "finance",
      title: "Finance operations",
      href: "/dashboard/finance",
      description: "Outstanding tuition and scholarship utilization (read-only)",
    },
    {
      id: "hr",
      title: "Workforce",
      href: "/dashboard/hr",
      description: "Staffing and recruiting analytics",
    },
  ] as const;
}
