/**
 * Teacher timesheets — Finance/workforce timekeeping only (no payroll engine duplication).
 */

import { createTimekeepingService, listTimesheets } from "@academyos";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getTeacherTodaySessions } from "@/lib/teacher/queries";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getTeacherTimesheetPreview(
  supabase: AuthClient,
  input: {
    organizationId: string;
    employeeId: string;
  }
) {
  const sessions = await getTeacherTodaySessions(supabase, input.employeeId);
  const completed = sessions.filter((s) =>
    ["completed", "complete", "documented"].includes(s.lessonStatus.toLowerCase())
  );

  const sessionMinutesEstimate = completed.length * 60;
  let sheets: ReturnType<typeof listTimesheets> = [];
  try {
    sheets = listTimesheets(input.organizationId, input.employeeId);
  } catch {
    sheets = [];
  }

  const latest = sheets[0] ?? null;
  const service = createTimekeepingService();

  return {
    weeklySheets: sheets.slice(0, 8),
    latest,
    sessionSummaries: completed.map((s) => ({
      id: s.id as string,
      label: String((s.course as { name?: string } | null)?.name ?? "Session"),
      timeDisplay: s.timeDisplay,
      status: s.lessonStatus,
    })),
    payrollPreview: {
      completedSessionsToday: completed.length,
      estimatedMinutesFromSessions: sessionMinutesEstimate,
      note: "Preview only — payroll calculation remains on Finance / workforce services.",
    },
    timekeeping: service,
  };
}
