import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  type FamilyGap,
  type MissingField,
  type StudentGap,
} from "@/lib/people/completeness-shared";

/**
 * Which households are missing something a parent could tell us.
 *
 * Enrolled students only. Chasing a withdrawn child's date of birth is a way to
 * annoy a family the school has already lost.
 *
 * Server-only: reaches the database. Labels and types live in
 * `completeness-shared.ts` so the public form can use them too.
 */

function clean(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text : null;
}

export async function findFamiliesWithGaps(): Promise<FamilyGap[]> {
  const supabase = await createAuthClient();

  const { data, error } = await supabase
    .from("students")
    .select(
      "id, first_name, last_name, date_of_birth, grade_level, enrollment_status, school_id, family_id, schools(name), families(id, family_name, billing_email, billing_phone, primary_address, guardians(first_name, last_name, email, phone, is_primary))"
    )
    .eq("enrollment_status", "enrolled");

  if (error) {
    throw new Error(`Completeness check failed reading students — ${error.message}`);
  }

  const families = new Map<string, FamilyGap & { students: StudentGap[] }>();

  for (const row of (data ?? []) as Record<string, any>[]) {
    const family = row.families as Record<string, any> | null;
    // A student with no family has no one to write to. That is a different
    // problem, and pretending otherwise would produce a request with no
    // recipient.
    if (!family?.id) continue;

    const familyId = String(family.id);
    if (!families.has(familyId)) {
      const guardians = Array.isArray(family.guardians) ? family.guardians : [];
      const guardian =
        guardians.find((g: Record<string, any>) => g.is_primary === true) ?? guardians[0];

      const email = clean(guardian?.email) ?? clean(family.billing_email);
      const phone = clean(guardian?.phone) ?? clean(family.billing_phone);

      const familyMissing: MissingField[] = [];
      if (!email) familyMissing.push("email");
      if (!phone) familyMissing.push("phone");
      if (!clean(family.primary_address)) familyMissing.push("address");

      families.set(familyId, {
        familyId,
        familyName: clean(family.family_name) ?? "Family",
        schoolId: String(row.school_id ?? ""),
        schoolName: row.schools?.name ?? "—",
        email,
        guardianName:
          [clean(guardian?.first_name), clean(guardian?.last_name)]
            .filter(Boolean)
            .join(" ") || null,
        students: [],
        familyMissing,
      });
    }

    const missing: MissingField[] = [];
    if (!clean(row.date_of_birth)) missing.push("date_of_birth");
    if (!clean(row.grade_level)) missing.push("grade_level");

    if (missing.length) {
      families.get(familyId)!.students.push({
        id: String(row.id),
        name: `${clean(row.first_name) ?? ""} ${clean(row.last_name) ?? ""}`.trim(),
        missing,
      });
    }
  }

  return [...families.values()]
    .filter((f) => f.familyMissing.length > 0 || f.students.length > 0)
    .sort((a, b) => a.familyName.localeCompare(b.familyName));
}
