import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function loadFamilyRecord(supabase: AuthClient, familyId: string) {
  const { data } = await supabase
    .from("families")
    .select("*, schools(name, organization_id)")
    .eq("id", familyId)
    .maybeSingle();
  return data;
}

export async function loadFamilyStudents(supabase: AuthClient, familyId: string) {
  const { data } = await supabase
    .from("students")
    .select(
      "id, first_name, last_name, preferred_name, grade_level, program, enrollment_status, lifecycle_stage, student_number, campus_id, campuses(name), sis_enrollments(enrollment_status, program, school_years(name))"
    )
    .eq("family_id", familyId)
    .order("last_name");
  return data ?? [];
}

export async function loadFamilyStudentIds(
  supabase: AuthClient,
  familyId: string
): Promise<string[]> {
  const students = await loadFamilyStudents(supabase, familyId);
  return students.map((student) => student.id);
}
