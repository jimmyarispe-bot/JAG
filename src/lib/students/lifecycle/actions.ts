"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  archiveStudent,
  coerceStudentId,
  deleteStudent,
  getStudentDependencyReport,
  getStudentImportOrigin,
  restoreStudent,
} from "./service";
import { requireStudentLifecycleAccess } from "./access";
import { getStudentById } from "@/lib/students/queries";

function revalidateStudentPaths(studentId?: string) {
  revalidatePath("/dashboard/students");
  if (studentId) revalidatePath(`/dashboard/students/${studentId}`);
}

/**
 * Archive student — uses the SAME lookup as the profile page (`getStudentById`)
 * so a visible student can never fail with a false "Student not found".
 */
export async function archiveStudentAction(input: {
  studentId: string;
  reason?: string | null;
}) {
  const access = await requireStudentLifecycleAccess();
  if (!access.ok) {
    return { ok: false as const, error: access.error, code: "forbidden" as const };
  }

  // Next may pass `{ studentId }` or (rarely) a bare string.
  const studentId =
    coerceStudentId(input) ??
    coerceStudentId(typeof input === "object" && input ? input.studentId : input);

  if (!studentId) {
    return {
      ok: false as const,
      error: "Archive failed: missing student id in server action payload.",
      code: "not_found" as const,
    };
  }

  // Profile-page lookup — proves auth + RLS can see this row.
  const profileStudent = await getStudentById(studentId);
  if (!profileStudent) {
    return {
      ok: false as const,
      error: `Unable to load student ${studentId} with profile query (getStudentById). Check RLS / id mismatch.`,
      code: "not_found" as const,
    };
  }

  const supabase = await createAuthClient();
  const result = await archiveStudent(supabase, {
    studentId: profileStudent.id,
    reason: typeof input === "object" && input ? input.reason : undefined,
  });
  if (result.ok) revalidateStudentPaths(profileStudent.id);
  return result;
}

export async function restoreStudentAction(input: { studentId: string }) {
  const access = await requireStudentLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error, code: "forbidden" as const };

  const studentId =
    coerceStudentId(input) ??
    coerceStudentId(typeof input === "object" && input ? input.studentId : input);
  if (!studentId) {
    return {
      ok: false as const,
      error: "Restore failed: missing student id.",
      code: "not_found" as const,
    };
  }

  const supabase = await createAuthClient();
  const result = await restoreStudent(supabase, { studentId });
  if (result.ok) revalidateStudentPaths(studentId);
  return result;
}

export async function deleteStudentAction(input: {
  studentId: string;
  confirmationText: string;
  acknowledged: boolean;
}) {
  const access = await requireStudentLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error, code: "forbidden" as const };

  const supabase = await createAuthClient();
  const result = await deleteStudent(supabase, {
    ...input,
    studentId: coerceStudentId(input.studentId) ?? input.studentId,
  });
  if (result.ok) {
    revalidatePath("/dashboard/students");
  }
  return result;
}

export async function getStudentDeleteContextAction(studentId: string) {
  const access = await requireStudentLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error };

  const id = coerceStudentId(studentId) ?? studentId;
  const supabase = await createAuthClient();
  const student = await getStudentById(id);
  if (!student) return { ok: false as const, error: "Student not found" };

  const [dependencies, importOrigin] = await Promise.all([
    getStudentDependencyReport(supabase, id),
    getStudentImportOrigin(supabase, id),
  ]);

  return {
    ok: true as const,
    student: {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      studentNumber: student.student_number,
      schoolName: student.schools?.name ?? null,
      program: student.program,
      status: student.status,
      enrollmentStatus: student.enrollment_status,
      isArchived: student.status === "archived",
    },
    dependencies,
    importOrigin,
  };
}
