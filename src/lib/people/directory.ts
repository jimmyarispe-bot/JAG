import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  pipelineStageLabel,
  resolvePipelineStageFromLeadStage,
} from "@/lib/admissions/registry/stages";
import {
  groupForLead,
  groupForStudent,
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

export async function getDirectory(): Promise<DirectoryPerson[]> {
  const supabase = await createAuthClient();

  const [studentsRes, leadsRes, overridesRes] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, first_name, last_name, grade_level, program, enrollment_status, date_of_birth, created_at, schools(name), families(family_name)"
      ),
    supabase
      .from("admissions_leads")
      .select(
        "id, first_name, last_name, current_grade, applying_for_grade, program, lead_stage, date_of_birth, created_at, guardian_first_name, guardian_last_name, guardian_email, guardian_phone, schools(name)"
      ),
    supabase.from("person_directory_overrides").select("person_kind, person_id, group_key"),
  ]);

  // Keyed "kind:id" so a student and a prospect cannot collide on a shared id.
  const overrides = new Map<string, PersonGroup>();
  for (const row of overridesRes.data ?? []) {
    const r = row as Record<string, any>;
    overrides.set(`${r.person_kind}:${r.person_id}`, r.group_key as PersonGroup);
  }

  const people: DirectoryPerson[] = [];

  for (const row of studentsRes.data ?? []) {
    const r = row as Record<string, any>;
    const status = String(r.enrollment_status ?? "unknown");
    people.push({
      id: String(r.id),
      kind: "student",
      firstName: String(r.first_name ?? ""),
      lastName: String(r.last_name ?? ""),
      school: r.schools?.name ?? "—",
      grade: r.grade_level ?? null,
      program: r.program ?? null,
      status,
      statusLabel: titleCase(status),
      ...applyOverride(overrides, "student", String(r.id), groupForStudent(status)),
      guardianName: r.families?.family_name ?? null,
      guardianEmail: null,
      guardianPhone: null,
      dateOfBirth: r.date_of_birth ?? null,
      createdAt: r.created_at ?? null,
      href: `/dashboard/students/${r.id}`,
    });
  }

  for (const row of leadsRes.data ?? []) {
    const r = row as Record<string, any>;
    const stage = String(r.lead_stage ?? "unknown");
    const pipelineKey = resolvePipelineStageFromLeadStage(stage);
    people.push({
      id: String(r.id),
      kind: "prospect",
      firstName: String(r.first_name ?? ""),
      lastName: String(r.last_name ?? ""),
      school: r.schools?.name ?? "—",
      grade: r.current_grade ?? r.applying_for_grade ?? null,
      program: r.program ?? null,
      status: stage,
      statusLabel: pipelineKey ? pipelineStageLabel(pipelineKey) : titleCase(stage),
      ...applyOverride(overrides, "prospect", String(r.id), groupForLead(stage)),
      guardianName: joinName(r.guardian_first_name, r.guardian_last_name),
      guardianEmail: r.guardian_email ?? null,
      guardianPhone: r.guardian_phone ?? null,
      dateOfBirth: r.date_of_birth ?? null,
      createdAt: r.created_at ?? null,
      href: `/dashboard/admissions/leads/${r.id}`,
    });
  }

  people.sort(
    (a, b) =>
      a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
  );

  return people;
}
