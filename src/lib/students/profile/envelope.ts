import { notFound } from "next/navigation";
import { buildProfileEnvelopeBase } from "@/lib/platform/profile/envelope";
import { extractSchoolOrganizationId } from "@/lib/platform/shared/context";
import { canAccessSchool } from "@/lib/platform/identity/school-access";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { StudentProfileEnvelope } from "@/lib/students/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function buildStudentProfileEnvelope(
  supabase: AuthClient,
  studentId: string,
  identity: IdentityContext
): Promise<StudentProfileEnvelope | null> {
  const { data: student } = await supabase
    .from("students")
    .select(
      "id, school_id, family_id, campus_id, first_name, last_name, preferred_name, grade_level, program, enrollment_status, lifecycle_stage, photo_url, schools(organization_id)"
    )
    .eq("id", studentId)
    .maybeSingle();

  if (!student) return null;

  if (!canAccessSchool(identity, student.school_id)) {
    notFound();
  }

  const organizationId = extractSchoolOrganizationId(student.schools);
  const displayName = student.preferred_name
    ? `${student.preferred_name} (${student.first_name} ${student.last_name})`
    : `${student.first_name} ${student.last_name}`;

  const base = await buildProfileEnvelopeBase(supabase, {
    profileKind: "student",
    entityType: "student",
    entityId: student.id,
    organizationId,
    schoolId: student.school_id,
    campusId: student.campus_id,
    displayName,
    subtitle: "Student Profile",
    basePath: "/dashboard/students",
    sectionParam: "section",
    defaultSection: "overview",
  });

  return {
    ...base,
    profileKind: "student",
    studentId: student.id,
    familyId: student.family_id,
    gradeLevel: student.grade_level,
    program: student.program,
    enrollmentStatus: student.enrollment_status,
    lifecycleStage: student.lifecycle_stage ?? null,
    photoUrl: student.photo_url,
    preferredName: student.preferred_name,
  };
}
