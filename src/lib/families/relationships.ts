import { recordActivity } from "@/lib/platform/activity";
import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import { syncStudentPlatformRelationships } from "@/lib/students/platform-sync";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type MoveStudentResult =
  | { ok: true; studentId: string; familyId: string }
  | { ok: false; error: string };

/**
 * Assign or move a student to a family. Enforces a single active family link.
 */
export async function moveStudentToFamily(
  supabase: AuthClient,
  input: { studentId: string; familyId: string; reason?: string | null }
): Promise<MoveStudentResult> {
  const [{ data: student }, { data: family }] = await Promise.all([
    supabase
      .from("students")
      .select("id, school_id, family_id, first_name, last_name")
      .eq("id", input.studentId)
      .maybeSingle(),
    supabase
      .from("families")
      .select("id, school_id, family_name, status")
      .eq("id", input.familyId)
      .maybeSingle(),
  ]);

  if (!student) return { ok: false, error: "Student not found." };
  if (!family) return { ok: false, error: "Family not found." };
  if (family.status === "archived") {
    return { ok: false, error: "Cannot assign a student to an archived family." };
  }
  if (student.school_id !== family.school_id) {
    return { ok: false, error: "Student and family must belong to the same school." };
  }
  if (student.family_id === family.id) {
    return { ok: true, studentId: student.id, familyId: family.id };
  }

  const previousFamilyId = student.family_id;
  const { error } = await supabase
    .from("students")
    .update({ family_id: family.id })
    .eq("id", student.id);
  if (error) return { ok: false, error: error.message };

  try {
    await syncStudentPlatformRelationships(supabase, student.id);
  } catch {
    // best-effort
  }

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = await resolveSchoolContext(supabase, student.school_id);
  try {
    await recordActivity(supabase, {
      eventType: "student.moved",
      moduleKey: "sis",
      entityType: "student",
      entityId: student.id,
      title: "Student moved to family",
      summary: `${student.first_name} ${student.last_name} → ${family.family_name}`,
      organizationId: schoolCtx?.organizationId,
      schoolId: student.school_id,
      studentId: student.id,
      familyId: family.id,
      actorUserId,
      sourceTable: "students",
      sourceId: student.id,
      payload: {
        previousFamilyId,
        newFamilyId: family.id,
        reason: input.reason ?? null,
      },
    });
  } catch {
    // best-effort
  }

  return { ok: true, studentId: student.id, familyId: family.id };
}

/**
 * Automatic siblings: other non-archived students sharing the same family_id.
 */
export async function getFamilySiblings(
  supabase: AuthClient,
  studentId: string
): Promise<
  Array<{
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    grade_level: string | null;
    program: string | null;
    status: string | null;
    enrollment_status: string;
    photo_url: string | null;
    school_id: string;
    schools?: { name: string } | null;
  }>
> {
  const { data: student } = await supabase
    .from("students")
    .select("id, family_id")
    .eq("id", studentId)
    .maybeSingle();

  if (!student?.family_id) return [];

  const { data } = await supabase
    .from("students")
    .select(
      "id, first_name, last_name, preferred_name, grade_level, program, status, enrollment_status, photo_url, school_id, schools(name)"
    )
    .eq("family_id", student.family_id)
    .neq("id", studentId)
    .neq("status", "archived")
    .order("last_name");

  return (data ?? []).map((row) => {
    const schoolRel = row.schools as { name?: string } | { name?: string }[] | null;
    const schoolName = Array.isArray(schoolRel)
      ? schoolRel[0]?.name ?? null
      : schoolRel?.name ?? null;
    return {
      id: row.id as string,
      first_name: row.first_name as string,
      last_name: row.last_name as string,
      preferred_name: (row.preferred_name as string | null) ?? null,
      grade_level: (row.grade_level as string | null) ?? null,
      program: (row.program as string | null) ?? null,
      status: (row.status as string | null) ?? null,
      enrollment_status: (row.enrollment_status as string) ?? "unknown",
      photo_url: (row.photo_url as string | null) ?? null,
      school_id: row.school_id as string,
      schools: schoolName ? { name: schoolName } : null,
    };
  });
}
