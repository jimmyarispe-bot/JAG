/**
 * Student home dashboard composition over existing student-dashboard + deadlines + notifications.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getStudentSelfDashboard } from "@/lib/portal/student-dashboard";
import { getStudentDeadlines } from "@/lib/compliance/deadlines";
import { getPortalNotifications } from "@/lib/portal/notifications";
import { getPortalTasks } from "@/lib/portal/tasks";
import { STUDENT_QUICK_ACTIONS } from "./constants";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getStudentExperienceHome(
  supabase: AuthClient,
  userId: string,
  studentId: string
) {
  const [dashboard, deadlines, notifications, tasks] = await Promise.all([
    getStudentSelfDashboard(supabase, studentId),
    getStudentDeadlines(supabase, studentId),
    getPortalNotifications(supabase, userId, 8),
    getPortalTasks(supabase, userId, [studentId]),
  ]);

  const announcements = notifications.filter(
    (n) =>
      String(n.category ?? "").toLowerCase().includes("announce") ||
      String(n.title ?? "").toLowerCase().includes("announce")
  );

  const upcomingSessions = [
    ...(dashboard.todaySchedule.sessions ?? []).map((s) => ({
      id: String((s as { id: string }).id),
      label: "Class",
      at: String((s as { scheduled_start?: string }).scheduled_start ?? ""),
      kind: "class" as const,
    })),
    ...(dashboard.todaySchedule.services ?? []).map((s) => ({
      id: String((s as { id: string }).id),
      label: String((s as { service_type?: string }).service_type ?? "Session"),
      at: String((s as { scheduled_at?: string }).scheduled_at ?? ""),
      kind: "service" as const,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return {
    dashboard,
    deadlines,
    announcements,
    notifications,
    tasks,
    upcomingSessions,
    quickActions: STUDENT_QUICK_ACTIONS,
  };
}
