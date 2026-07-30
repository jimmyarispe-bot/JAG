import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  getTeacherComplianceItems,
  getTeacherTodaySessions,
  getTeacherWorkloadSummary,
} from "@/lib/teacher/queries";
import { getTeacherDocumentationDeadlines } from "@/lib/compliance/deadlines";
import { getPortalNotifications } from "@/lib/portal/notifications";
import { TEACHER_QUICK_ACTIONS } from "./constants";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getTeacherExperienceHome(
  supabase: AuthClient,
  employeeId: string,
  userId: string
) {
  const [sessions, workload, compliance, docDeadlines, notifications] =
    await Promise.all([
      getTeacherTodaySessions(supabase, employeeId),
      getTeacherWorkloadSummary(supabase, employeeId),
      getTeacherComplianceItems(supabase, employeeId),
      getTeacherDocumentationDeadlines(supabase, employeeId),
      getPortalNotifications(supabase, userId, 8),
    ]);

  const currentClass = sessions.find(
    (s) => !["completed", "complete", "documented"].includes(s.lessonStatus.toLowerCase())
  );

  const announcements = notifications.filter(
    (n) =>
      String(n.category ?? "").toLowerCase().includes("announce") ||
      String(n.title ?? "").toLowerCase().includes("announce")
  );

  const tasks = [
    ...docDeadlines.slice(0, 5).map((d) => ({
      id: d.id,
      title: d.title,
      href: d.href ?? "/dashboard/teacher/progress",
    })),
    ...compliance.slice(0, 5).map((c, i) => ({
      id: `comp-${i}-${c.title}`,
      title: c.title,
      href: "/dashboard/teacher/progress",
    })),
  ];

  return {
    sessions,
    workload,
    currentClass: currentClass ?? null,
    upcomingSessions: sessions.slice(0, 8),
    announcements,
    notifications,
    tasks,
    quickActions: TEACHER_QUICK_ACTIONS,
  };
}
