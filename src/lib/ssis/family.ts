import { createAuthClient } from "@/lib/supabase/server-auth";
import { getFamilySiblings } from "@/lib/families/relationships";

/**
 * Automatic siblings via shared family_id, plus any explicit SSIS sibling links.
 */
export async function getStudentSiblings(studentId: string) {
  const supabase = await createAuthClient();

  const [familySiblings, { data: links }] = await Promise.all([
    getFamilySiblings(supabase, studentId),
    supabase
      .from("ssis_student_sibling_links")
      .select("sibling_student_id, relationship_label")
      .eq("student_id", studentId),
  ]);

  const byId = new Map<
    string,
    {
      id: string;
      first_name?: string;
      last_name?: string;
      preferred_name?: string | null;
      grade_level?: string | null;
      program?: string | null;
      status?: string | null;
      enrollment_status?: string;
      photo_url?: string | null;
      school_id?: string;
      schools?: { name: string } | null;
      relationship_label?: string | null;
    }
  >();

  for (const sibling of familySiblings) {
    byId.set(sibling.id, { ...sibling, relationship_label: "sibling" });
  }

  const missingLinkIds = (links ?? [])
    .map((l) => l.sibling_student_id)
    .filter((id) => id && !byId.has(id));

  if (missingLinkIds.length) {
    const { data: extras } = await supabase
      .from("students")
      .select(
        "id, first_name, last_name, preferred_name, grade_level, program, status, enrollment_status, photo_url, school_id, schools(name)"
      )
      .in("id", missingLinkIds);
    for (const row of extras ?? []) {
      const link = links?.find((l) => l.sibling_student_id === row.id);
      const schoolRel = row.schools as { name?: string } | { name?: string }[] | null;
      const schoolName = Array.isArray(schoolRel)
        ? schoolRel[0]?.name ?? null
        : schoolRel?.name ?? null;
      byId.set(row.id, {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        preferred_name: row.preferred_name,
        grade_level: row.grade_level,
        program: row.program,
        status: row.status,
        enrollment_status: row.enrollment_status,
        photo_url: row.photo_url,
        school_id: row.school_id,
        schools: schoolName ? { name: schoolName } : null,
        relationship_label: link?.relationship_label ?? "sibling",
      });
    }
  }

  for (const link of links ?? []) {
    const existing = byId.get(link.sibling_student_id);
    if (existing && link.relationship_label) {
      existing.relationship_label = link.relationship_label;
    }
  }

  return [...byId.values()];
}

export async function getFamilyHouseholds(familyId: string) {
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("family_households")
    .select("*")
    .eq("family_id", familyId)
    .order("is_primary", { ascending: false });
  return data ?? [];
}
