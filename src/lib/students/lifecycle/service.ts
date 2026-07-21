import { recordActivity } from "@/lib/platform/activity";
import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { findStudentImportOrigin, inspectStudentDependencies } from "./dependencies";
import type {
  ArchiveStudentInput,
  DeleteStudentInput,
  LifecycleResult,
  RestoreStudentInput,
  StudentDependencyReport,
  StudentImportOrigin,
} from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

interface StudentRow {
  id: string;
  school_id: string;
  family_id: string | null;
  first_name: string;
  last_name: string;
  status: string | null;
  previous_status: string | null;
  enrollment_status: string;
  program: string | null;
  student_number: string | null;
  archived_at: string | null;
}

async function loadStudent(
  supabase: AuthClient,
  studentId: string
): Promise<StudentRow | null> {
  const { data } = await supabase
    .from("students")
    .select(
      "id, school_id, family_id, first_name, last_name, status, previous_status, enrollment_status, program, student_number, archived_at"
    )
    .eq("id", studentId)
    .maybeSingle();
  return (data as StudentRow | null) ?? null;
}

/**
 * Soft-archive a student. Historical records remain intact.
 * Sets status = 'archived' and stores previous_status for restore.
 */
export async function archiveStudent(
  supabase: AuthClient,
  input: ArchiveStudentInput
): Promise<LifecycleResult> {
  const student = await loadStudent(supabase, input.studentId);
  if (!student) return { ok: false, error: "Student not found", code: "not_found" };
  if (student.status === "archived") {
    return { ok: false, error: "Student is already archived", code: "already_archived" };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const previousStatus = student.status && student.status !== "archived" ? student.status : "active";

  const { error } = await supabase
    .from("students")
    .update({
      previous_status: previousStatus,
      status: "archived",
      archived_at: new Date().toISOString(),
      archived_by: actorUserId,
    })
    .eq("id", student.id);

  if (error) return { ok: false, error: error.message, code: "failed" };

  const schoolCtx = await resolveSchoolContext(supabase, student.school_id);
  try {
    await recordActivity(supabase, {
      eventType: "student.archived",
      moduleKey: "sis",
      entityType: "student",
      entityId: student.id,
      title: "Student archived",
      summary: `${student.first_name} ${student.last_name}`,
      organizationId: schoolCtx?.organizationId,
      schoolId: student.school_id,
      studentId: student.id,
      familyId: student.family_id,
      actorUserId,
      sourceTable: "students",
      sourceId: student.id,
      payload: {
        reason: input.reason ?? null,
        previousStatus,
      },
    });
  } catch {
    // best-effort audit
  }

  return { ok: true, studentId: student.id, message: "Student archived." };
}

/**
 * Restore an archived student to their previous status (default active).
 */
export async function restoreStudent(
  supabase: AuthClient,
  input: RestoreStudentInput
): Promise<LifecycleResult> {
  const student = await loadStudent(supabase, input.studentId);
  if (!student) return { ok: false, error: "Student not found", code: "not_found" };
  if (student.status !== "archived") {
    return { ok: false, error: "Student is not archived", code: "not_archived" };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const restoredStatus = student.previous_status?.trim() || "active";

  const { error } = await supabase
    .from("students")
    .update({
      status: restoredStatus,
      previous_status: null,
      archived_at: null,
      archived_by: null,
    })
    .eq("id", student.id);

  if (error) return { ok: false, error: error.message, code: "failed" };

  const schoolCtx = await resolveSchoolContext(supabase, student.school_id);
  try {
    await recordActivity(supabase, {
      eventType: "student.restored",
      moduleKey: "sis",
      entityType: "student",
      entityId: student.id,
      title: "Student restored",
      summary: `${student.first_name} ${student.last_name}`,
      organizationId: schoolCtx?.organizationId,
      schoolId: student.school_id,
      studentId: student.id,
      familyId: student.family_id,
      actorUserId,
      sourceTable: "students",
      sourceId: student.id,
      payload: { restoredStatus },
    });
  } catch {
    // best-effort
  }

  return { ok: true, studentId: student.id, message: "Student restored." };
}

/**
 * Permanently delete a student only when no blocking dependencies exist.
 * Requires confirmationText === "DELETE" and acknowledged === true.
 */
export async function deleteStudent(
  supabase: AuthClient,
  input: DeleteStudentInput
): Promise<LifecycleResult> {
  if (!input.acknowledged || input.confirmationText !== "DELETE") {
    return {
      ok: false,
      error: "Confirmation required. Check the box and type DELETE to continue.",
      code: "confirmation_required",
    };
  }

  const student = await loadStudent(supabase, input.studentId);
  if (!student) return { ok: false, error: "Student not found", code: "not_found" };

  const dependencies = await inspectStudentDependencies(
    supabase,
    student.id,
    student.family_id
  );

  if (!dependencies.canDelete) {
    return {
      ok: false,
      error: "This student has related records. Permanent deletion is unavailable. Archive the student instead.",
      code: "has_dependencies",
      dependencies,
      suggestArchive: true,
    };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = await resolveSchoolContext(supabase, student.school_id);
  const importOrigin = await findStudentImportOrigin(supabase, student.id);

  // Audit before hard delete
  try {
    await recordActivity(supabase, {
      eventType: "student.deleted",
      moduleKey: "sis",
      entityType: "student",
      entityId: student.id,
      title: "Student permanently deleted",
      summary: `${student.first_name} ${student.last_name}`,
      organizationId: schoolCtx?.organizationId,
      schoolId: student.school_id,
      studentId: student.id,
      familyId: student.family_id,
      actorUserId,
      sourceTable: "students",
      sourceId: student.id,
      payload: {
        confirmed: true,
        dependenciesChecked: true,
        blockingCount: 0,
        importOrigin,
        studentSnapshot: {
          firstName: student.first_name,
          lastName: student.last_name,
          studentNumber: student.student_number,
          program: student.program,
          status: student.status,
          enrollmentStatus: student.enrollment_status,
        },
      },
    });
  } catch {
    // best-effort
  }

  const { error } = await supabase.from("students").delete().eq("id", student.id);
  if (error) return { ok: false, error: error.message, code: "failed" };

  return { ok: true, studentId: student.id, message: "Student deleted successfully." };
}

export async function getStudentDependencyReport(
  supabase: AuthClient,
  studentId: string
): Promise<StudentDependencyReport | null> {
  const student = await loadStudent(supabase, studentId);
  if (!student) return null;
  return inspectStudentDependencies(supabase, studentId, student.family_id);
}

export async function getStudentImportOrigin(
  supabase: AuthClient,
  studentId: string
): Promise<StudentImportOrigin | null> {
  return findStudentImportOrigin(supabase, studentId);
}

export function isArchivedStatus(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "archived";
}
