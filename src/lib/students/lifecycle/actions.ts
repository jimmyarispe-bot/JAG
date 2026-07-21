"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  archiveStudent,
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

export async function archiveStudentAction(input: {
  studentId: string;
  reason?: string | null;
}) {
  const access = await requireStudentLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error, code: "forbidden" as const };

  const supabase = await createAuthClient();
  const result = await archiveStudent(supabase, {
    studentId: input.studentId,
    reason: input.reason,
  });
  if (result.ok) revalidateStudentPaths(input.studentId);
  return result;
}

export async function restoreStudentAction(input: { studentId: string }) {
  const access = await requireStudentLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error, code: "forbidden" as const };

  const supabase = await createAuthClient();
  const result = await restoreStudent(supabase, { studentId: input.studentId });
  if (result.ok) revalidateStudentPaths(input.studentId);
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
  const result = await deleteStudent(supabase, input);
  if (result.ok) {
    revalidatePath("/dashboard/students");
  }
  return result;
}

export async function getStudentDeleteContextAction(studentId: string) {
  const access = await requireStudentLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error };

  const supabase = await createAuthClient();
  const student = await getStudentById(studentId);
  if (!student) return { ok: false as const, error: "Student not found" };

  const [dependencies, importOrigin] = await Promise.all([
    getStudentDependencyReport(supabase, studentId),
    getStudentImportOrigin(supabase, studentId),
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
