/**
 * Resolve authenticated student self context for experience pages.
 */

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  canAccessStudentPortal,
  getStudentSelfId,
} from "@/lib/platform/identity/portal-access";

export async function requireStudentExperienceContext(nextPath: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect(`/login?next=${nextPath}`);

  const supabase = await createAuthClient();
  const [canStudent, studentId] = await Promise.all([
    canAccessStudentPortal(supabase, sessionUser.id),
    getStudentSelfId(supabase, sessionUser.id),
  ]);

  if (!canStudent || !studentId) {
    redirect("/portal");
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, first_name, last_name, school_id, grade_level, program")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) redirect("/portal");

  return {
    supabase,
    sessionUser,
    studentId,
    student,
    organizationId: student.school_id ?? "default",
  };
}
