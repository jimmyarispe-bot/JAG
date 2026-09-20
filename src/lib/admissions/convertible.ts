import { CONVERTIBLE_LEAD_STAGES } from "@/lib/sis/conversion";
import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * Leads that should be students, and what pressing the button will actually do.
 *
 * WHY THIS EXISTS. Measured on 20 September 2026: admissions_applications held
 * zero rows, sis_admissions_conversions held zero rows, and 102 students were
 * on the roster. Not one of them arrived through the conversion pipeline. The
 * pipeline was never broken - it had never run, because it required an
 * application that no form in the JAG creates.
 *
 * THE VERDICT IS COMPUTED, NOT GUESSED. A first draft of this list joined
 * students on `admissions_lead_id` - the very link being created - so a child
 * already on the roster read as "waiting to convert" and the obvious next move
 * was to create a second copy of a real student. That is the mistake this file
 * is shaped to make impossible: every lead is checked BY NAME against the
 * students already in that school, and a name match means LINK, never CREATE.
 *
 * WHEN TWO CHILDREN SHARE A NAME, NOBODY CONVERTS. The row says so and offers
 * no button. A wrong link is worse than a delay.
 */

export type ConvertVerdict = "linked" | "link" | "create" | "ambiguous";

export type ConvertibleLead = {
  leadId: string;
  studentName: string;
  leadStage: string;
  campus: string;
  schoolId: string;
  guardianName: string | null;
  guardianEmail: string | null;
  verdict: ConvertVerdict;
  /** Plain English, shown in the row. Never a code. */
  verdictNote: string;
  /** Set for "linked" and "link": the student this lead is or will be tied to. */
  studentId: string | null;
  caseHref: string;
};

export type ConvertibleList = {
  leads: ConvertibleLead[];
  /** Set when the list cannot be shown. The page renders this instead of "0 leads". */
  unavailable: string | null;
};

function fullName(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "(no name on the lead)";
}

function nameKey(first: string | null, last: string | null): string {
  return `${(first ?? "").trim().toLowerCase()}|${(last ?? "").trim().toLowerCase()}`;
}

function unavailable(reason: string): ConvertibleList {
  return { leads: [], unavailable: reason };
}

export async function getConvertibleLeads(): Promise<ConvertibleList> {
  const supabase = await createAuthClient();

  const { data: leads, error: leadsError } = await supabase
    .from("admissions_leads")
    // ONE STRING LITERAL, NOT A CONCATENATION - splitting it widens the type to
    // `string` and every column below resolves to GenericStringError.
    .select("id, first_name, last_name, lead_stage, school_id, guardian_first_name, guardian_last_name, guardian_email")
    .in("lead_stage", [...CONVERTIBLE_LEAD_STAGES])
    .order("last_name", { ascending: true });

  if (leadsError) return unavailable(`Could not read the leads: ${leadsError.message}`);
  if (!leads || leads.length === 0) return { leads: [], unavailable: null };

  const schoolIds = Array.from(
    new Set(leads.map((l) => l.school_id).filter((id): id is string => Boolean(id)))
  );

  const [studentsRes, schoolsRes] = await Promise.all([
    /* EVERY STUDENT, NOT JUST THIS CAMPUS'S - corrected 20 September. The first
       version scoped this to the lead's school, and La'Marrieon Williams -
       archived at The Academy GA, with a lead at The Academy HS - read as
       "not on the roster" and was duplicated. A child recorded at the wrong
       campus is precisely who a duplicate check is for. Eighty-odd rows; the
       school filter bought nothing and cost a real record. */
    supabase
      .from("students")
      .select("id, first_name, last_name, school_id, admissions_lead_id, status"),
    supabase.from("schools").select("id, name"),
  ]);

  if (studentsRes.error) {
    return unavailable(`Could not read the students: ${studentsRes.error.message}`);
  }
  if (schoolsRes.error) {
    return unavailable(`Could not read the campuses: ${schoolsRes.error.message}`);
  }

  const students = studentsRes.data ?? [];
  const schoolName = new Map((schoolsRes.data ?? []).map((s) => [s.id, s.name as string]));

  /* Students already tied to a lead, and students indexed by school + name.
     Both are needed: the first answers "is this one done", the second answers
     "would converting create a duplicate". */
  const byLead = new Map<string, string>();
  const byName = new Map<string, string[]>();
  /* Surname prefix -> the people behind it, so a mistyped or shortened name
     can be SEEN and refused rather than quietly creating a second child. */
  const bySurnamePrefix = new Map<string, Array<{ id: string; label: string }>>();

  for (const s of students) {
    if (s.admissions_lead_id) byLead.set(s.admissions_lead_id as string, s.id as string);

    const key = nameKey(s.first_name as string | null, s.last_name as string | null);
    byName.set(key, [...(byName.get(key) ?? []), s.id as string]);

    const last = (s.last_name ?? "").trim().toLowerCase().replace(/[^a-z]/g, "");
    const prefix = last.slice(0, 4);
    if (prefix) {
      const label =
        `${s.first_name ?? "?"} ${s.last_name ?? "?"}` +
        (s.status === "archived" ? " (archived)" : "");
      bySurnamePrefix.set(prefix, [
        ...(bySurnamePrefix.get(prefix) ?? []),
        { id: s.id as string, label },
      ]);
    }
  }

  const rows: ConvertibleLead[] = leads.map((lead) => {
    const name = fullName(lead.first_name as string | null, lead.last_name as string | null);
    const guardian =
      [lead.guardian_first_name, lead.guardian_last_name].filter(Boolean).join(" ").trim() || null;

    const linkedStudentId = byLead.get(lead.id as string) ?? null;
    const matches =
      byName.get(nameKey(lead.first_name as string | null, lead.last_name as string | null)) ?? [];

    const leadSurnamePrefix = (lead.last_name ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 4);
    const nearby = (bySurnamePrefix.get(leadSurnamePrefix) ?? []).filter(
      (n) => !matches.includes(n.id)
    );

    let verdict: ConvertVerdict;
    let verdictNote: string;
    let studentId: string | null = linkedStudentId;

    if (linkedStudentId) {
      verdict = "linked";
      verdictNote = "Already a student, already linked to this lead. Nothing to do.";
    } else if (matches.length > 1) {
      verdict = "ambiguous";
      verdictNote = `${matches.length} students across the network share this name. A person has to say which one. No button until then.`;
    } else if (matches.length === 0 && nearby.length > 0) {
      /* Not the same name, but close enough that creating could duplicate a
         real child. Max against Maximillian Salas, and Kelvin McClean against
         Kelvin Smith, both turned up on 20 September. Neither is a machine's
         decision to make. */
      verdict = "ambiguous";
      verdictNote =
        `No exact match, but these are close: ${nearby.slice(0, 4).map((n) => n.label).join(", ")}. ` +
        `A person has to say whether one of them is this child.`;
    } else if (matches.length === 1) {
      verdict = "link";
      studentId = matches[0];
      verdictNote = "Already on the roster, at this or another campus. This will LINK the lead to that student - it will not create a second one.";
    } else {
      verdict = "create";
      verdictNote = "Not on the roster. This will create the student, family, guardian and enrolment. It will NOT activate or bill.";
    }

    return {
      leadId: lead.id as string,
      studentName: name,
      leadStage: (lead.lead_stage as string | null) ?? "unknown",
      campus: schoolName.get(lead.school_id as string) ?? "Unknown campus",
      schoolId: lead.school_id as string,
      guardianName: guardian,
      guardianEmail: (lead.guardian_email as string | null) ?? null,
      verdict,
      verdictNote,
      studentId,
      caseHref: `/dashboard/admissions/cases/${lead.id}`,
    };
  });

  return { leads: rows, unavailable: null };
}
