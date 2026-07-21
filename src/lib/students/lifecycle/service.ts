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

/**
 * Accept any non-empty trimmed id string.
 * Do NOT apply RFC version/variant UUID checks — Postgres accepts any uuid
 * text, and imported/legacy ids may not be strict RFC 4122 (v1–v5 / 8–b).
 */
export function coerceStudentId(raw: unknown): string | null {
  if (typeof raw === "string") {
    const id = raw.trim();
    return id.length > 0 ? id : null;
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.studentId === "string" && obj.studentId.trim()) {
      return obj.studentId.trim();
    }
    if (typeof obj.id === "string" && obj.id.trim()) {
      return obj.id.trim();
    }
  }
  return null;
}

function mapStudentRow(data: Record<string, unknown>): StudentRow {
  return {
    id: String(data.id),
    school_id: String(data.school_id),
    family_id: (data.family_id as string | null) ?? null,
    first_name: String(data.first_name ?? ""),
    last_name: String(data.last_name ?? ""),
    status: (data.status as string | null) ?? null,
    previous_status: (data.previous_status as string | null) ?? null,
    enrollment_status: String(data.enrollment_status ?? ""),
    program: (data.program as string | null) ?? null,
    student_number: (data.student_number as string | null) ?? null,
    archived_at: (data.archived_at as string | null) ?? null,
  };
}

type LoadStudentResult =
  | { ok: true; student: StudentRow }
  | { ok: false; error: string; code: "not_found" | "failed"; dbError?: string };

/**
 * Same lookup shape as the working profile page (`getStudentById`):
 * `select("*, schools(name), campuses(name), families(family_name)")` + `eq("id", …)`.
 * Never treat a PostgREST/SQL error as "Student not found".
 */
export async function loadStudent(
  supabase: AuthClient,
  studentId: string
): Promise<LoadStudentResult> {
  const { data, error } = await supabase
    .from("students")
    .select("*, schools(name), campuses(name), families(family_name)")
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    console.error("[students.lifecycle] loadStudent:", error.message);
    return {
      ok: false,
      error: `Unable to load student: ${error.message}`,
      code: "failed",
      dbError: error.message,
    };
  }

  if (!data) {
    return { ok: false, error: "Student not found", code: "not_found" };
  }

  return { ok: true, student: mapStudentRow(data as Record<string, unknown>) };
}

async function applyStudentUpdate(
  supabase: AuthClient,
  studentId: string,
  patch: Record<string, unknown>
): Promise<{ error: { message: string } | null; updated: { id: string } | null }> {
  const primary = await supabase
    .from("students")
    .update(patch)
    .eq("id", studentId)
    .select("id")
    .maybeSingle();

  if (!primary.error && primary.data) {
    return { error: null, updated: primary.data as { id: string } };
  }

  if (!primary.error && !primary.data) {
    // RLS often yields 0 rows with no error — do not pretend success.
    return {
      error: {
        message:
          "Update matched 0 rows (RLS or missing students.edit permission). Student was found but could not be archived.",
      },
      updated: null,
    };
  }

  const message = primary.error!.message;
  console.error("[students.lifecycle] update failed:", message);

  if (/archived_by|foreign key|violates foreign key/i.test(message) && "archived_by" in patch) {
    const { archived_by: _drop, ...withoutActor } = patch;
    const retry = await supabase
      .from("students")
      .update(withoutActor)
      .eq("id", studentId)
      .select("id")
      .maybeSingle();
    if (!retry.error && retry.data) {
      return { error: null, updated: retry.data as { id: string } };
    }
    if (!retry.error && !retry.data) {
      return {
        error: {
          message:
            "Update matched 0 rows after archived_by retry (RLS / students.edit).",
        },
        updated: null,
      };
    }
    return { error: retry.error, updated: null };
  }

  if (/previous_status|archived_at|archived_by|column .* does not exist/i.test(message)) {
    const minimal: Record<string, unknown> = { status: patch.status };
    const retry = await supabase
      .from("students")
      .update(minimal)
      .eq("id", studentId)
      .select("id")
      .maybeSingle();
    if (!retry.error && retry.data) {
      return { error: null, updated: retry.data as { id: string } };
    }
    return {
      error: retry.error ?? {
        message: "Status-only archive update matched 0 rows (RLS).",
      },
      updated: null,
    };
  }

  return { error: primary.error, updated: null };
}

/**
 * Soft-archive a student. Historical records remain intact.
 * Sets status = 'archived' and stores previous_status for restore.
 *
 * Lookup uses the same select shape as `getStudentById` (profile page).
 * Callers that already verified the student (e.g. archiveStudentAction)
 * still go through loadStudent so update errors are never mislabeled.
 */
export async function archiveStudent(
  supabase: AuthClient,
  input: ArchiveStudentInput
): Promise<LifecycleResult> {
  const studentId = coerceStudentId(input.studentId);

  if (!studentId) {
    return {
      ok: false,
      error: "Archive failed: missing student id in server action payload.",
      code: "not_found",
    };
  }

  const loaded = await loadStudent(supabase, studentId);
  if (!loaded.ok) {
    return {
      ok: false,
      error: loaded.error,
      code: loaded.code,
    };
  }

  const student = loaded.student;
  if (student.status === "archived") {
    return { ok: false, error: "Student is already archived", code: "already_archived" };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const previousStatus =
    student.status && student.status !== "archived" ? student.status : "active";

  const { error } = await applyStudentUpdate(supabase, student.id, {
    previous_status: previousStatus,
    status: "archived",
    archived_at: new Date().toISOString(),
    archived_by: actorUserId,
  });

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
  const studentId = coerceStudentId(input.studentId);
  if (!studentId) {
    return {
      ok: false,
      error: "Restore failed: missing student id.",
      code: "not_found",
    };
  }

  const loaded = await loadStudent(supabase, studentId);
  if (!loaded.ok) {
    return { ok: false, error: loaded.error, code: loaded.code };
  }

  const student = loaded.student;
  if (student.status !== "archived") {
    return { ok: false, error: "Student is not archived", code: "not_archived" };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const restoredStatus = student.previous_status?.trim() || "active";

  const { error } = await applyStudentUpdate(supabase, student.id, {
    status: restoredStatus,
    previous_status: null,
    archived_at: null,
    archived_by: null,
  });

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

  const studentId = coerceStudentId(input.studentId);
  if (!studentId) {
    return {
      ok: false,
      error: "Delete failed: missing student id.",
      code: "not_found",
    };
  }

  const loaded = await loadStudent(supabase, studentId);
  if (!loaded.ok) {
    return { ok: false, error: loaded.error, code: loaded.code };
  }

  const student = loaded.student;
  const dependencies = await inspectStudentDependencies(
    supabase,
    student.id,
    student.family_id
  );

  if (!dependencies.canDelete) {
    return {
      ok: false,
      error:
        "This student has related records. Permanent deletion is unavailable. Archive the student instead.",
      code: "has_dependencies",
      dependencies,
      suggestArchive: true,
    };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = await resolveSchoolContext(supabase, student.school_id);
  const importOrigin = await findStudentImportOrigin(supabase, student.id);

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
  const id = coerceStudentId(studentId);
  if (!id) return null;
  const loaded = await loadStudent(supabase, id);
  if (!loaded.ok) return null;
  return inspectStudentDependencies(supabase, id, loaded.student.family_id);
}

export async function getStudentImportOrigin(
  supabase: AuthClient,
  studentId: string
): Promise<StudentImportOrigin | null> {
  const id = coerceStudentId(studentId);
  if (!id) return null;
  return findStudentImportOrigin(supabase, id);
}

export function isArchivedStatus(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "archived";
}
