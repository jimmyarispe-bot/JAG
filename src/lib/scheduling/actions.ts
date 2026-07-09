"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { generateSectionSessions } from "@/lib/scheduling/session-generator";
import { detectSchedulingConflicts, syncConflictsToMissionControl } from "@/lib/scheduling/conflicts";
import { recordSessionAttendance } from "@/lib/scheduling/attendance-bridge";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { resolvePrimarySchoolId } from "@/lib/platform/identity/school-access";

export async function generateSessionsAction(formData: FormData) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx?.permissions.includes("scheduling.generate")) {
    return { error: "Permission denied" };
  }

  const sectionId = formData.get("section_id") as string;
  const dateFrom = formData.get("date_from") as string;
  const dateTo = formData.get("date_to") as string;

  const result = await generateSectionSessions(supabase, {
    sectionId,
    dateFrom,
    dateTo,
    generatedBy: ctx.effectiveUserId,
  });

  revalidatePath("/dashboard/scheduling");
  return result;
}

export async function runSchedulingIntelligenceAction(formData: FormData) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx?.permissions.includes("scheduling.executive") && !ctx?.permissions.includes("scheduling.manage")) {
    return { error: "Permission denied" };
  }

  const schoolId =
    resolvePrimarySchoolId(ctx, formData.get("school_id") as string | undefined) ??
    ctx.orgAssignments[0]?.school_id;
  if (!schoolId) return { error: "School required" };

  const conflicts = await detectSchedulingConflicts(supabase, schoolId);
  await syncConflictsToMissionControl(supabase, schoolId);

  revalidatePath("/dashboard/scheduling");
  return { success: true, conflictCount: conflicts.length };
}

export async function recordSessionAttendanceAction(formData: FormData) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (
    !ctx?.permissions.includes("scheduling.attendance") &&
    !ctx?.permissions.includes("students.attendance")
  ) {
    return { error: "Permission denied" };
  }

  const sessionId = formData.get("session_id") as string;
  const studentId = formData.get("student_id") as string;
  const status = formData.get("status") as string;
  const notes = (formData.get("notes") as string) || undefined;
  const notifyParent = formData.get("notify_parent") === "true";

  const result = await recordSessionAttendance(supabase, {
    sessionId,
    studentId,
    status,
    notes,
    notifyParent,
    recordedBy: ctx.effectiveUserId,
  });

  revalidatePath("/dashboard/scheduling");
  revalidatePath(`/dashboard/students/${studentId}`);
  return result;
}

export async function resolveScheduleConflictAction(formData: FormData) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx?.permissions.includes("scheduling.manage")) {
    return { error: "Permission denied" };
  }

  const conflictId = formData.get("conflict_id") as string;
  const { error } = await supabase
    .from("schedule_conflicts")
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", conflictId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/scheduling");
  return { success: true };
}

export async function submitTeacherAvailabilityAction(formData: FormData) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (
    !ctx?.permissions.includes("scheduling.manage") &&
    !ctx?.permissions.includes("teacher.availability")
  ) {
    return { error: "Permission denied" };
  }

  const employeeId = formData.get("employee_id") as string;
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const effectiveFrom = (formData.get("effective_from") as string) || null;
  const effectiveTo = (formData.get("effective_to") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!employeeId || Number.isNaN(dayOfWeek) || !startTime || !endTime) {
    return { error: "Employee, day, start time, and end time are required" };
  }

  const { error } = await supabase.from("employee_availability").insert({
    employee_id: employeeId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    is_available: true,
    effective_from: effectiveFrom,
    effective_to: effectiveTo,
    notes,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/scheduling");
  revalidatePath("/dashboard/teacher");
  return { success: true };
}

export async function submitStudentSchedulingRequestAction(formData: FormData) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (
    !ctx?.permissions.includes("scheduling.manage") &&
    !ctx?.permissions.includes("students.manage") &&
    !ctx?.permissions.includes("family.portal")
  ) {
    return { error: "Permission denied" };
  }

  const studentId = formData.get("student_id") as string;
  const schoolYearId = (formData.get("school_year_id") as string) || null;
  const timezone = (formData.get("timezone") as string) || "America/New_York";
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startLocal = (formData.get("preferred_start_time_local") as string) || null;
  const endLocal = (formData.get("preferred_end_time_local") as string) || null;
  const notes = (formData.get("availability_notes") as string) || null;

  if (!studentId || Number.isNaN(dayOfWeek)) {
    return { error: "Student and day of week are required" };
  }

  const { localTimeToEasternMinutes } = await import("@/lib/scheduling/academy-way");
  const startEt = startLocal
    ? `${String(Math.floor(localTimeToEasternMinutes(startLocal, timezone) / 60)).padStart(2, "0")}:${String(localTimeToEasternMinutes(startLocal, timezone) % 60).padStart(2, "0")}:00`
    : null;
  const endEt = endLocal
    ? `${String(Math.floor(localTimeToEasternMinutes(endLocal, timezone) / 60)).padStart(2, "0")}:${String(localTimeToEasternMinutes(endLocal, timezone) % 60).padStart(2, "0")}:00`
    : null;

  const { error } = await supabase.from("student_schedule_preferences").upsert(
    {
      student_id: studentId,
      school_year_id: schoolYearId,
      timezone,
      day_of_week: dayOfWeek,
      preferred_start_time_local: startLocal,
      preferred_end_time_local: endLocal,
      preferred_start_time_et: startEt,
      preferred_end_time_et: endEt,
      availability_notes: notes,
    },
    { onConflict: "student_id,school_year_id,day_of_week" }
  );

  if (error) return { error: error.message };
  revalidatePath("/dashboard/scheduling");
  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true };
}

export async function runStudentPlacementAction(formData: FormData) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx?.permissions.includes("scheduling.manage") && !ctx?.permissions.includes("scheduling.executive")) {
    return { error: "Permission denied" };
  }

  const studentId = formData.get("student_id") as string;
  const schoolId =
    resolvePrimarySchoolId(ctx, formData.get("school_id") as string | undefined) ??
    ctx.orgAssignments[0]?.school_id;
  const schoolYearId = formData.get("school_year_id") as string;
  const program = (formData.get("program") as string) || null;

  if (!studentId || !schoolId || !schoolYearId) {
    return { error: "Student, school, and school year are required" };
  }

  const { runPlacementForStudent } = await import("@/lib/scheduling/intelligence");
  const result = await runPlacementForStudent(supabase, {
    studentId,
    schoolId,
    schoolYearId,
    program,
  });

  revalidatePath("/dashboard/scheduling");
  revalidatePath(`/dashboard/students/${studentId}`);
  return result.courseSectionId
    ? { success: true, courseSectionId: result.courseSectionId }
    : { error: result.reason ?? "No matching section found" };
}

export async function declareEmergencyCoverageAction(formData: FormData) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx?.permissions.includes("scheduling.manage") && !ctx?.permissions.includes("teacher.sessions")) {
    return { error: "Permission denied" };
  }

  const schoolId =
    resolvePrimarySchoolId(ctx, formData.get("school_id") as string | undefined) ??
    ctx.orgAssignments[0]?.school_id;
  const sessionId = formData.get("session_id") as string;
  const originalEmployeeId = formData.get("original_employee_id") as string;
  const reason = (formData.get("reason") as string) || undefined;

  if (!schoolId || !sessionId || !originalEmployeeId) {
    return { error: "School, session, and teacher are required" };
  }

  const { declareEmergencyCoverage } = await import("@/lib/scheduling/emergency-coverage");
  const result = await declareEmergencyCoverage(supabase, {
    schoolId,
    sessionId,
    originalEmployeeId,
    reason,
    actorUserId: ctx.effectiveUserId,
  });

  revalidatePath("/dashboard/scheduling");
  return result;
}
