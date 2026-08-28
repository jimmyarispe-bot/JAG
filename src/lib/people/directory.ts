import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  pipelineStageLabel,
  resolvePipelineStageFromLeadStage,
} from "@/lib/admissions/registry/stages";
import {
  groupForLead,
  groupForStudent,
  type ContactSource,
  type SchoolOption,
  type DirectoryPerson,
  type PersonGroup,
  type PersonKind,
} from "@/lib/people/directory-shared";

/**
 * One list of every child the network knows about.
 *
 * They live in two tables — `students` for anyone enrolled, withdrawn or
 * graduated, `admissions_leads` for everyone still in the pipeline plus those
 * who declined or did not return. No page joined them, so "show me everyone"
 * could not be answered without running two queries and merging by hand.
 *
 * Server-only: this reaches the database. Types and category logic live in
 * `directory-shared.ts` so client components can use them too.
 */

function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function joinName(first?: string | null, last?: string | null): string | null {
  const parts = [first, last].map((p) => (p ?? "").trim()).filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function clean(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text : null;
}

function applyOverride(
  overrides: Map<string, PersonGroup>,
  kind: PersonKind,
  id: string,
  derivedGroup: PersonGroup
): Pick<DirectoryPerson, "group" | "derivedGroup" | "overridden"> {
  const override = overrides.get(`${kind}:${id}`);
  return {
    group: override ?? derivedGroup,
    derivedGroup,
    overridden: Boolean(override) && override !== derivedGroup,
  };
}

type Contact = Pick<
  DirectoryPerson,
  "guardianName" | "guardianEmail" | "guardianPhone" | "contactSource"
>;

const NO_CONTACT: Contact = {
  guardianName: null,
  guardianEmail: null,
  guardianPhone: null,
  contactSource: "none",
};

/**
 * Which of a family's guardians to show. Contact details are the point, so a
 * guardian who has them outranks one who does not, whatever the flags say.
 */
function pickGuardian(
  guardians: Record<string, unknown>[]
): Record<string, unknown> | null {
  if (!guardians.length) return null;
  const reachable = guardians.filter((g) => clean(g.email) || clean(g.phone));
  const pool = reachable.length ? reachable : guardians;
  return pool.find((g) => g.is_primary === true) ?? pool[0];
}

/**
 * Parent contact for a student, best source first.
 *
 * `students` has no contact columns of its own — it reaches a parent through
 * `families` → `guardians`. Where that chain is empty the child's own
 * admissions lead usually still holds the enquiry contact, so it is used as a
 * last resort and reported as such rather than passed off as a family record.
 */
function contactForStudent(
  family: Record<string, unknown> | null,
  lead: Record<string, unknown> | null
): Contact {
  const guardians = (family?.guardians ?? []) as Record<string, unknown>[];
  const guardian = pickGuardian(Array.isArray(guardians) ? guardians : []);
  const guardianName = guardian
    ? joinName(clean(guardian.first_name), clean(guardian.last_name))
    : null;
  const familyName = clean(family?.family_name);

  if (guardian && (clean(guardian.email) || clean(guardian.phone))) {
    return {
      guardianName: guardianName ?? familyName,
      guardianEmail: clean(guardian.email),
      guardianPhone: clean(guardian.phone),
      contactSource: "guardian",
    };
  }

  const billingEmail = clean(family?.billing_email);
  const billingPhone = clean(family?.billing_phone);
  if (billingEmail || billingPhone) {
    return {
      guardianName: guardianName ?? familyName,
      guardianEmail: billingEmail,
      guardianPhone: billingPhone,
      contactSource: "family",
    };
  }

  if (lead) {
    const leadEmail = clean(lead.guardian_email);
    const leadPhone = clean(lead.guardian_phone);
    if (leadEmail || leadPhone) {
      return {
        guardianName:
          joinName(clean(lead.guardian_first_name), clean(lead.guardian_last_name)) ??
          guardianName ??
          familyName,
        guardianEmail: leadEmail,
        guardianPhone: leadPhone,
        contactSource: "lead",
      };
    }
  }

  // A parent named with no way to reach them is still worth showing.
  const nameOnly = guardianName ?? familyName;
  if (nameOnly) {
    return { ...NO_CONTACT, guardianName: nameOnly, contactSource: "guardian" };
  }

  return NO_CONTACT;
}

/** Same child, same school — the only name match safe enough to act on. */
function identityKey(
  schoolId: unknown,
  firstName: unknown,
  lastName: unknown,
  dateOfBirth: unknown
): string | null {
  const first = clean(firstName)?.toLowerCase();
  const last = clean(lastName)?.toLowerCase();
  const dob = clean(dateOfBirth);
  const school = clean(schoolId);
  // Without a date of birth this is just a name, and this network has several
  // children who share one. No key, no match.
  if (!first || !last || !dob || !school) return null;
  return `${school}|${last}|${first}|${dob}`;
}

export async function getDirectory(): Promise<DirectoryPerson[]> {
  const supabase = await createAuthClient();

  const [studentsRes, leadsRes, overridesRes] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, school_id, first_name, last_name, grade_level, program, enrollment_status, date_of_birth, created_at, admissions_lead_id, schools(name), families(family_name, billing_email, billing_phone, guardians(first_name, last_name, email, phone, is_primary))"
      ),
    supabase
      .from("admissions_leads")
      .select(
        "id, school_id, first_name, last_name, current_grade, applying_for_grade, program, lead_stage, date_of_birth, created_at, archived_at, guardian_first_name, guardian_last_name, guardian_email, guardian_phone, schools(name)"
      ),
    supabase.from("person_directory_overrides").select("person_kind, person_id, group_key"),
  ]);

  // Fail loudly. PostgREST answers a query naming a column that does not exist
  // with an error and no rows, so a missing migration would quietly empty half
  // this page rather than break it — and a directory that silently drops every
  // prospect looks exactly like a directory with no prospects.
  for (const [label, result] of [
    ["students", studentsRes],
    ["admissions_leads", leadsRes],
    ["person_directory_overrides", overridesRes],
  ] as const) {
    if (result.error) {
      throw new Error(`People directory: reading ${label} failed — ${result.error.message}`);
    }
  }

  // Keyed "kind:id" so a student and a prospect cannot collide on a shared id.
  const overrides = new Map<string, PersonGroup>();
  for (const row of overridesRes.data ?? []) {
    const r = row as Record<string, any>;
    overrides.set(`${r.person_kind}:${r.person_id}`, r.group_key as PersonGroup);
  }

  const leadRows = (leadsRes.data ?? []) as Record<string, any>[];

  // Two ways back to a student's own enquiry: the explicit link written at
  // conversion, and — for the imported roster, which has none — school plus
  // name plus date of birth. A key claimed by two leads is dropped rather than
  // guessed at, so an ambiguous pair shows no contact instead of the wrong one.
  const leadsById = new Map<string, Record<string, any>>();
  const leadsByIdentity = new Map<string, Record<string, any> | null>();
  for (const lead of leadRows) {
    leadsById.set(String(lead.id), lead);
    const key = identityKey(lead.school_id, lead.first_name, lead.last_name, lead.date_of_birth);
    if (!key) continue;
    leadsByIdentity.set(key, leadsByIdentity.has(key) ? null : lead);
  }

  const people: DirectoryPerson[] = [];

  for (const row of (studentsRes.data ?? []) as Record<string, any>[]) {
    const status = String(row.enrollment_status ?? "unknown");
    const family = (row.families ?? null) as Record<string, unknown> | null;

    const key = identityKey(row.school_id, row.first_name, row.last_name, row.date_of_birth);
    const lead =
      (row.admissions_lead_id ? leadsById.get(String(row.admissions_lead_id)) : null) ??
      (key ? leadsByIdentity.get(key) ?? null : null);

    people.push({
      id: String(row.id),
      kind: "student",
      firstName: String(row.first_name ?? ""),
      lastName: String(row.last_name ?? ""),
      school: row.schools?.name ?? "—",
      schoolId: row.school_id ? String(row.school_id) : null,
      grade: row.grade_level ?? null,
      program: row.program ?? null,
      status,
      statusLabel: titleCase(status),
      ...applyOverride(overrides, "student", String(row.id), groupForStudent(status)),
      ...contactForStudent(family, lead),
      dateOfBirth: row.date_of_birth ?? null,
      createdAt: row.created_at ?? null,
      archived: status === "archived",
      href: `/dashboard/students/${row.id}`,
    });
  }

  for (const row of leadRows) {
    const stage = String(row.lead_stage ?? "unknown");
    const pipelineKey = resolvePipelineStageFromLeadStage(stage);
    const guardianName = joinName(
      clean(row.guardian_first_name),
      clean(row.guardian_last_name)
    );
    const guardianEmail = clean(row.guardian_email);
    const guardianPhone = clean(row.guardian_phone);

    people.push({
      id: String(row.id),
      kind: "prospect",
      firstName: String(row.first_name ?? ""),
      lastName: String(row.last_name ?? ""),
      school: row.schools?.name ?? "—",
      schoolId: row.school_id ? String(row.school_id) : null,
      grade: row.current_grade ?? row.applying_for_grade ?? null,
      program: row.program ?? null,
      status: stage,
      statusLabel: pipelineKey ? pipelineStageLabel(pipelineKey) : titleCase(stage),
      ...applyOverride(overrides, "prospect", String(row.id), groupForLead(stage)),
      guardianName,
      guardianEmail,
      guardianPhone,
      contactSource: guardianEmail || guardianPhone || guardianName ? "lead" : "none",
      dateOfBirth: row.date_of_birth ?? null,
      createdAt: row.created_at ?? null,
      archived: Boolean(row.archived_at),
      href: `/dashboard/admissions/leads/${row.id}`,
    });
  }

  people.sort(
    (a, b) =>
      a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
  );

  return people;
}

/**
 * Schools the editor can move somebody to. Names alone will not do -- moving a
 * record needs the id.
 */
export async function getSchoolOptions(): Promise<SchoolOption[]> {
  const supabase = await createAuthClient();
  const { data } = await supabase.from("schools").select("id, name").order("name");
  return (data ?? []).map((row) => ({
    id: String((row as Record<string, unknown>).id),
    name: String((row as Record<string, unknown>).name ?? "—"),
  }));
}
