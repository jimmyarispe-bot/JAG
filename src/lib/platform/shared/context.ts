import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface SchoolContext {
  schoolId: string;
  organizationId: string | null;
  campusId: string | null;
}

/** Extract organization_id from a Supabase nested `schools(...)` join (object or array). */
export function extractSchoolOrganizationId(schools: unknown): string | null {
  if (!schools) return null;
  if (Array.isArray(schools)) {
    const first = schools[0] as { organization_id?: string | null } | undefined;
    return first?.organization_id ?? null;
  }
  return (schools as { organization_id?: string | null }).organization_id ?? null;
}
export async function resolveSchoolContext(
  supabase: AuthClient,
  schoolId: string
): Promise<SchoolContext | null> {
  const { data } = await supabase
    .from("schools")
    .select("id, organization_id")
    .eq("id", schoolId)
    .maybeSingle();

  if (!data) return null;

  return {
    schoolId: data.id,
    organizationId: data.organization_id ?? null,
    campusId: null,
  };
}

/** Resolve organization from a student record. */
export async function resolveStudentContext(
  supabase: AuthClient,
  studentId: string
): Promise<(SchoolContext & { studentId: string; familyId: string | null }) | null> {
  const { data } = await supabase
    .from("students")
    .select("id, school_id, family_id, campus_id, schools(organization_id)")
    .eq("id", studentId)
    .maybeSingle();

  if (!data) return null;

  const school = data.schools;

  return {
    studentId: data.id,
    schoolId: data.school_id,
    organizationId: extractSchoolOrganizationId(school),
    campusId: data.campus_id ?? null,
    familyId: data.family_id ?? null,
  };
}

/** Current authenticated user id (null if unavailable). */
export async function resolveActorUserId(supabase: AuthClient): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
