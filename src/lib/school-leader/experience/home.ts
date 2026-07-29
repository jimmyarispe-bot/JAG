/**
 * School Leader home — campus overview composed from existing services.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getExecutiveAdmissionsMetrics } from "@/lib/admissions/executive-metrics";
import { getStudentStats } from "@/lib/students/queries";
import {
  getSchedulingExecutiveStats,
  getStaffWorkload,
  getScheduleConflicts,
} from "@/lib/scheduling/queries";
import { getExecutiveDeadlineAnalytics } from "@/lib/compliance/deadlines";
import { listAnnouncements } from "@/lib/communications/announcements";
import { getEmployees } from "@/lib/hr/queries";
import { SCHOOL_LEADER_QUICK_ACTIONS } from "./constants";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getSchoolLeaderExperienceHome(
  supabase: AuthClient,
  schoolId: string | null
) {
  const [admissions, studentStats, scheduling, conflicts, compliance, announcements, employees] =
    await Promise.all([
      getExecutiveAdmissionsMetrics(),
      getStudentStats(),
      getSchedulingExecutiveStats(schoolId ?? undefined),
      getScheduleConflicts(schoolId ?? undefined),
      getExecutiveDeadlineAnalytics(supabase, schoolId ?? undefined),
      listAnnouncements(supabase, { schoolId, limit: 8 }),
      getEmployees(),
    ]);

  let teacherAvailability: {
    staffCount: number;
    overCapacity: number;
    underUtilized: number;
  } = { staffCount: 0, overCapacity: 0, underUtilized: 0 };

  if (schoolId) {
    try {
      const workload = await getStaffWorkload(schoolId);
      teacherAvailability = {
        staffCount: workload.length,
        overCapacity: workload.filter((w) => w.overloaded).length,
        underUtilized: workload.filter((w) => w.weeklyHours < 10 && w.sessionCount === 0).length,
      };
    } catch {
      teacherAvailability = {
        staffCount: employees.filter((e) => e.employment_status === "active").length,
        overCapacity: 0,
        underUtilized: 0,
      };
    }
  } else {
    teacherAvailability = {
      staffCount: employees.filter((e) => e.employment_status === "active").length,
      overCapacity: 0,
      underUtilized: 0,
    };
  }

  const alerts = [
    ...(scheduling.openConflicts > 0
      ? [
          {
            id: "sched-conflicts",
            title: `${scheduling.openConflicts} open schedule conflict(s)`,
            href: "/dashboard/school-leader/scheduling",
          },
        ]
      : []),
    ...(compliance.familyOverdue + compliance.studentOverdue + compliance.staffOverdue > 0
      ? [
          {
            id: "compliance-overdue",
            title: `${compliance.familyOverdue + compliance.studentOverdue + compliance.staffOverdue} overdue compliance item(s)`,
            href: "/dashboard/school-leader/compliance",
          },
        ]
      : []),
    ...(admissions.awaitingDecision > 0
      ? [
          {
            id: "admissions-decision",
            title: `${admissions.awaitingDecision} application(s) awaiting decision`,
            href: "/dashboard/school-leader/enrollment",
          },
        ]
      : []),
  ];

  const tasks = [
    {
      id: "review-enrollment",
      title: "Review enrollment pipeline",
      href: "/dashboard/school-leader/enrollment",
    },
    {
      id: "review-attendance",
      title: "Check attendance & scheduling health",
      href: "/dashboard/school-leader/scheduling",
    },
    {
      id: "review-compliance",
      title: "Review compliance checklist",
      href: "/dashboard/school-leader/compliance",
    },
  ];

  return {
    campus: {
      enrolledStudents: studentStats.enrolled,
      activeStudents: studentStats.active,
      totalStudents: studentStats.total,
      sessionsThisWeek: scheduling.sessionsThisWeek,
      completedSessions: scheduling.completedSessions,
      teacherUtilization: scheduling.teacherUtilization,
    },
    attendanceToday: {
      sessionsScheduled: scheduling.scheduledSessions,
      sessionsCompleted: scheduling.completedSessions,
      note: "Campus attendance health derived from scheduling session status (existing Scheduling service).",
    },
    enrollment: {
      newInquiries: admissions.newInquiries,
      applicationsSubmitted: admissions.applicationsSubmitted,
      accepted: admissions.accepted,
      waitlisted: admissions.waitlisted,
      enrolled:
        admissions.funnel.find((f) => f.stepId === "enrolled")?.count ?? studentStats.enrolled,
    },
    teacherAvailability,
    alerts,
    tasks,
    announcements,
    conflicts: conflicts.slice(0, 5),
    compliance,
    quickActions: SCHOOL_LEADER_QUICK_ACTIONS,
  };
}
