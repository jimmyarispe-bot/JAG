/**
 * Parent home dashboard composition — extends getParentDashboardData with
 * today's schedule, announcements, and quick-action payloads.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getParentDashboardData } from "@/lib/portal/dashboard";
import { getStudentSchedule } from "@/lib/scheduling/queries";
import { getPortalNotifications } from "@/lib/portal/notifications";
import { PARENT_QUICK_ACTIONS } from "./constants";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type TodayScheduleItem = {
  studentId: string;
  studentName: string;
  label: string;
  startsAt: string;
  kind: "class" | "service" | "meeting";
};

export async function getParentExperienceHome(
  supabase: AuthClient,
  userId: string
) {
  const dashboard = await getParentDashboardData(supabase, userId);
  const today = new Date().toISOString().split("T")[0]!;
  const schedule: TodayScheduleItem[] = [];

  for (const student of dashboard.students) {
    const sched = await getStudentSchedule(student.id);
    for (const s of sched.sessions ?? []) {
      const start = (s as { scheduled_start?: string }).scheduled_start;
      if (!start?.startsWith(today)) continue;
      schedule.push({
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`,
        label: String((s as { title?: string; name?: string }).title ?? (s as { name?: string }).name ?? "Class"),
        startsAt: start,
        kind: "class",
      });
    }
    for (const s of sched.services ?? []) {
      const start = (s as { scheduled_at?: string }).scheduled_at;
      if (!start?.startsWith(today)) continue;
      schedule.push({
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`,
        label: String((s as { service_type?: string }).service_type ?? "Service"),
        startsAt: start,
        kind: "service",
      });
    }
  }

  schedule.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const notifications = await getPortalNotifications(supabase, userId, 8);
  const announcements = notifications.filter(
    (n) =>
      String(n.category ?? "").toLowerCase().includes("announce") ||
      String(n.title ?? "").toLowerCase().includes("announce")
  );

  return {
    ...dashboard,
    todaySchedule: schedule,
    announcements,
    recentNotifications: notifications,
    quickActions: PARENT_QUICK_ACTIONS,
  };
}
