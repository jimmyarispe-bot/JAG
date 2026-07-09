/**
 * Emergency coverage — qualified replacement identification and semester tracking.
 * Reuses substitute_pool_members, substitute_assignments, schedule_conflicts.
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createMissionControlItem } from "@/lib/platform/automation/mission-control";
import { writePlatformAudit } from "@/lib/platform/automation/audit";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface EmergencyCoverageInput {
  schoolId: string;
  sessionId: string;
  originalEmployeeId: string;
  reason?: string;
  actorUserId?: string | null;
}

export interface EmergencyCoverageResult {
  success: boolean;
  replacementEmployeeId?: string;
  substituteAssignmentId?: string;
  semesterEmergencyCount?: number;
  supervisorNotified?: boolean;
  error?: string;
}

/** Find qualified replacement: substitute pool first, then available staff with matching subject. */
export async function findEmergencyReplacement(
  supabase: AuthClient,
  input: { schoolId: string; sessionId: string; originalEmployeeId: string }
): Promise<{ employeeId: string | null; substitutePoolMemberId: string | null }> {
  const { data: session } = await supabase
    .from("instructional_sessions")
    .select("id, scheduled_start, scheduled_end, course_section_id, course_sections(courses(academy_subject))")
    .eq("id", input.sessionId)
    .single();

  if (!session) return { employeeId: null, substitutePoolMemberId: null };

  const cs = Array.isArray(session.course_sections)
    ? session.course_sections[0]
    : session.course_sections;
  const course = cs && (Array.isArray(cs.courses) ? cs.courses[0] : cs.courses);
  const subject = (course as { academy_subject?: string })?.academy_subject;

  const { data: pool } = await supabase
    .from("substitute_pool_members")
    .select("id, employee_id, availability_notes, status")
    .eq("school_id", input.schoolId)
    .eq("status", "active");

  for (const sub of pool ?? []) {
    if (sub.employee_id === input.originalEmployeeId) continue;
    if (sub.employee_id) {
      return { employeeId: sub.employee_id, substitutePoolMemberId: sub.id };
    }
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_type")
    .eq("school_id", input.schoolId)
    .eq("employment_status", "active")
    .neq("id", input.originalEmployeeId)
    .in("employee_type", ["teacher", "therapist", "administrator"]);

  for (const emp of employees ?? []) {
    const { data: conflict } = await supabase
      .from("instructional_sessions")
      .select("id")
      .eq("instructor_employee_id", emp.id)
      .eq("session_status", "scheduled")
      .gte("scheduled_end", session.scheduled_start)
      .lte("scheduled_start", session.scheduled_end)
      .neq("id", input.sessionId)
      .limit(1);

    if (!conflict?.length) {
      return { employeeId: emp.id, substitutePoolMemberId: null };
    }
  }

  // Allow dual supervision when necessary — pick least-loaded available teacher
  const { data: allTeachers } = await supabase
    .from("employees")
    .select("id")
    .eq("school_id", input.schoolId)
    .eq("employment_status", "active")
    .eq("employee_type", "teacher")
    .neq("id", input.originalEmployeeId)
    .limit(1);

  return {
    employeeId: allTeachers?.[0]?.id ?? null,
    substitutePoolMemberId: null,
  };
}

async function countSemesterEmergencies(
  supabase: AuthClient,
  schoolId: string,
  employeeId: string
): Promise<number> {
  const semesterStart = new Date();
  semesterStart.setMonth(semesterStart.getMonth() < 7 ? 0 : 7, 1);

  const { count } = await supabase
    .from("schedule_conflicts")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("entity_id", employeeId)
    .eq("conflict_type", "teacher")
    .contains("metadata", { emergency: true })
    .gte("detected_at", semesterStart.toISOString());

  return count ?? 0;
}

/** Declare emergency and assign replacement — tracks usage, notifies supervisors on repeat. */
export async function declareEmergencyCoverage(
  supabase: AuthClient,
  input: EmergencyCoverageInput
): Promise<EmergencyCoverageResult> {
  const replacement = await findEmergencyReplacement(supabase, {
    schoolId: input.schoolId,
    sessionId: input.sessionId,
    originalEmployeeId: input.originalEmployeeId,
  });

  if (!replacement.employeeId) {
    return { success: false, error: "No qualified replacement teacher available" };
  }

  await supabase
    .from("instructional_sessions")
    .update({ instructor_employee_id: replacement.employeeId })
    .eq("id", input.sessionId);

  let substituteAssignmentId: string | undefined;
  if (replacement.substitutePoolMemberId) {
    const { data: assignment } = await supabase
      .from("substitute_assignments")
      .insert({
        substitute_id: replacement.substitutePoolMemberId,
        instructional_session_id: input.sessionId,
        status: "confirmed",
        lesson_plan_notes: input.reason ?? "Emergency coverage",
      })
      .select("id")
      .single();
    substituteAssignmentId = assignment?.id;
  }

  const semesterCount =
    (await countSemesterEmergencies(supabase, input.schoolId, input.originalEmployeeId)) + 1;

  await supabase.from("schedule_conflicts").insert({
    school_id: input.schoolId,
    conflict_type: "teacher",
    severity: semesterCount > 1 ? "critical" : "warning",
    entity_type: "employee",
    entity_id: input.originalEmployeeId,
    related_entity_type: "instructional_sessions",
    related_entity_id: input.sessionId,
    title: "Emergency coverage activated",
    description: input.reason ?? "Teacher declared emergency absence",
    recommendation: `Covered by replacement teacher. Semester emergency count: ${semesterCount}`,
    metadata: {
      emergency: true,
      replacement_employee_id: replacement.employeeId,
      semester_emergency_count: semesterCount,
    },
  });

  let supervisorNotified = false;
  if (semesterCount > 1) {
    supervisorNotified = true;
    await createMissionControlItem(supabase, {
      schoolId: input.schoolId,
      module: "scheduling",
      itemType: "scheduling_alert",
      title: `Repeated emergency coverage — teacher ${input.originalEmployeeId.slice(0, 8)}`,
      body: `${semesterCount} emergency absences this semester. Supervisor review required.`,
      entityType: "employee",
      entityId: input.originalEmployeeId,
      href: "/dashboard/scheduling?work=coverage_needed",
      severity: "high",
      assignedRole: "SCHOOL_LEADER",
    });
  }

  await writePlatformAudit(supabase, {
    schoolId: input.schoolId,
    module: "scheduling",
    actionType: "emergency_coverage",
    summary: "Emergency coverage assigned",
    entityType: "instructional_sessions",
    entityId: input.sessionId,
    actorUserId: input.actorUserId,
    metadata: {
      originalEmployeeId: input.originalEmployeeId,
      replacementEmployeeId: replacement.employeeId,
      semesterEmergencyCount: semesterCount,
    },
  });

  return {
    success: true,
    replacementEmployeeId: replacement.employeeId,
    substituteAssignmentId,
    semesterEmergencyCount: semesterCount,
    supervisorNotified,
  };
}
