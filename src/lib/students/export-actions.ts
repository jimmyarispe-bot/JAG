"use server";

import { createAuthClient } from "@/lib/supabase/server-auth";
import { getStudents, type StudentListStatusFilter } from "@/lib/students/queries";
import {
  buildCsv,
  exportFileName,
  type ExportRow,
} from "@/lib/students/export";

/**
 * Build the students CSV for whatever the caller is currently looking at.
 *
 * ACCESS. There is no permission check in this file, and that is the design.
 * getStudents() and the two reads below all go through createAuthClient(), so
 * RLS answers exactly as it does for the list on screen. Whoever can see a
 * child in the list can export that child; whoever cannot, cannot. Adding a
 * second rule here would create two answers to one question, and the second
 * one would eventually disagree with the first.
 *
 * WHY THE RELATED ROWS ARE FETCHED SEPARATELY. A PostgREST embed of guardians
 * through families is a second path from students to a table students already
 * embeds, and an ambiguous embed takes the WHOLE select down - which is how
 * migration 406 broke every timesheet in the platform on 21 Sep. Two plain
 * reads keyed by id cannot become ambiguous.
 */
export async function exportStudentsCsvAction(input: {
  statusFilter: StudentListStatusFilter;
  schoolId?: string;
  campusName?: string | null;
  fields: string[];
}): Promise<{ csv: string; fileName: string; rowCount: number } | { error: string }> {
  const students = await getStudents(input.statusFilter, input.schoolId);

  /*
   * Zero students is a legitimate answer - an empty campus, or a filter that
   * matches nobody. It is returned as an error rather than an empty file
   * because a CSV with headers and no rows looks like a successful export of
   * nothing, and "the export is empty" and "there are no students" are
   * different sentences.
   */
  if (students.length === 0) {
    return { error: "No students match the current filters, so there is nothing to export." };
  }

  const supabase = await createAuthClient();

  const familyIds = [
    ...new Set(
      students
        .map((s) => (s as unknown as Record<string, unknown>).family_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];

  const familyById = new Map<string, Record<string, unknown>>();
  const guardiansByFamily = new Map<string, Record<string, unknown>[]>();

  if (familyIds.length > 0) {
    const { data: families } = await supabase
      .from("families")
      .select(
        "id, family_name, primary_address, city, state, zip_code, billing_email, billing_phone, preferred_language"
      )
      .in("id", familyIds);

    for (const f of (families ?? []) as Record<string, unknown>[]) {
      familyById.set(String(f.id), f);
    }

    const { data: guardians } = await supabase
      .from("guardians")
      .select(
        "family_id, first_name, last_name, relationship_to_student, email, phone, is_primary"
      )
      .in("family_id", familyIds);

    for (const g of (guardians ?? []) as Record<string, unknown>[]) {
      const key = String(g.family_id);
      const existing = guardiansByFamily.get(key);
      if (existing) existing.push(g);
      else guardiansByFamily.set(key, [g]);
    }
  }

  const rows: ExportRow[] = students.map((student) => {
    const familyId = String((student as unknown as Record<string, unknown>).family_id ?? "");
    return {
      student: student as unknown as ExportRow["student"],
      family: familyById.get(familyId) ?? null,
      guardians: guardiansByFamily.get(familyId) ?? [],
    };
  });

  return {
    csv: buildCsv(rows, input.fields),
    fileName: exportFileName(input.campusName ?? null, input.statusFilter, new Date()),
    rowCount: rows.length,
  };
}
