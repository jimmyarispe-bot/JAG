/**
 * Parent attendance views — reads existing SIS attendance tables only.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type ParentAttendanceRow = {
  id: string;
  studentId: string;
  attendanceDate: string;
  status: string;
  notes: string | null;
};

export async function getParentAttendanceHistory(
  supabase: AuthClient,
  studentIds: string[],
  opts?: { days?: number }
): Promise<ParentAttendanceRow[]> {
  if (!studentIds.length) return [];
  const days = opts?.days ?? 60;
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("student_attendance_records")
    .select("id, student_id, attendance_date, status, notes")
    .in("student_id", studentIds)
    .gte("attendance_date", since)
    .order("attendance_date", { ascending: false })
    .limit(200);

  return (data ?? []).map((r) => ({
    id: r.id,
    studentId: r.student_id,
    attendanceDate: r.attendance_date,
    status: r.status,
    notes: (r as { notes?: string | null }).notes ?? null,
  }));
}

export function summarizeAttendance(rows: ParentAttendanceRow[]) {
  let present = 0;
  let absent = 0;
  let tardy = 0;
  let excused = 0;
  for (const r of rows) {
    const s = r.status.toLowerCase();
    if (s.includes("present") || s === "on_time") present += 1;
    else if (s.includes("excuse")) excused += 1;
    else if (s.includes("tardy") || s.includes("late")) tardy += 1;
    else if (s.includes("absent")) absent += 1;
  }
  return { present, absent, tardy, excused, total: rows.length };
}
