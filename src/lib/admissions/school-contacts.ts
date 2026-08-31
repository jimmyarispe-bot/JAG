import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * Who handles admissions at each school, and where a family books time with
 * them.
 *
 * Server-only. The shape is shared with the editor through
 * `school-contacts-shared.ts` so the client never reaches for this module.
 */

export interface SchoolAdmissionsContact {
  readonly id: string;
  readonly name: string;
  readonly contactName: string | null;
  readonly contactEmail: string | null;
  readonly bookingUrl: string | null;
  /** Whether this school appears in the public inquiry form's dropdown. */
  readonly publicInquiries: boolean;
  /** Leads received, so a school nobody can reach is visible as such. */
  readonly leadCount: number;
}

function clean(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text : null;
}

export async function getSchoolAdmissionsContacts(): Promise<SchoolAdmissionsContact[]> {
  const supabase = await createAuthClient();

  const [schoolsRes, leadsRes] = await Promise.all([
    supabase
      .from("schools")
      .select(
        "id, name, admissions_contact_name, admissions_contact_email, admissions_booking_url, admissions_interest_public"
      )
      .order("name"),
    supabase.from("admissions_leads").select("school_id"),
  ]);

  // Fail loudly. PostgREST answers a query naming a missing column with an
  // error and no rows, so an unapplied migration would render an empty page
  // that looks exactly like "no schools".
  if (schoolsRes.error) {
    throw new Error(`Admissions contacts: reading schools failed — ${schoolsRes.error.message}`);
  }

  const leadsBySchool = new Map<string, number>();
  for (const row of leadsRes.data ?? []) {
    const id = String((row as Record<string, unknown>).school_id ?? "");
    if (id) leadsBySchool.set(id, (leadsBySchool.get(id) ?? 0) + 1);
  }

  return (schoolsRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const id = String(r.id);
    return {
      id,
      name: String(r.name ?? "—"),
      contactName: clean(r.admissions_contact_name),
      contactEmail: clean(r.admissions_contact_email),
      bookingUrl: clean(r.admissions_booking_url),
      publicInquiries: r.admissions_interest_public === true,
      leadCount: leadsBySchool.get(id) ?? 0,
    };
  });
}
