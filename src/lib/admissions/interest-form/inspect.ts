/**
 * Reading the live form, for the people who own its words.
 *
 * SHIP ONE OF FOUR, AND IT ONLY LOOKS. Nothing here writes. The interest form
 * is on version 22 because twenty-two migrations were the only way to change
 * a sentence, and the first thing anybody needs - before a single edit button
 * exists - is to be able to SEE what the live form actually asks, section by
 * section, without me reading the database out loud to them.
 *
 * WHY THE SERVICE ROLE. The definition tables are locked to the org's admins
 * by RLS written for the public submission path, and this page is already
 * gated on FORM_BUILDER_ACCESS - Jimmy and Danni. Reading through the service
 * role keeps the page from being a second, weaker copy of that gate that
 * could drift from it. It reads. It never writes.
 *
 * EVERY VERSION, NOT JUST THE LIVE ONE. A published version is immutable and
 * a submission points at the version it was made against, so the archive is
 * how anybody answers "what did this family actually agree to in March?" -
 * which is the whole reason versioning exists and is worth showing.
 */

import {
  parseInterestFormDefinition,
  validateInterestFormDefinition,
} from "@/lib/admissions/interest-form/definition";
import type { InterestFormDefinition } from "@/lib/admissions/interest-form/types";
import { createServiceRoleClient } from "@/lib/supabase/server";

export interface FormVersionSummary {
  id: string;
  versionNumber: number;
  lifecycle: "draft" | "published" | "archived" | string;
  createdAt: string | null;
  publishedAt: string | null;
  /** Null when the stored definition cannot be parsed - said, never hidden. */
  definition: InterestFormDefinition | null;
  /** Why a definition could not be shown, in words. */
  problem: string | null;
}

export interface FormInspection {
  formId: string;
  title: string;
  organizationId: string;
  organizationName: string;
  versions: FormVersionSummary[];
  publishedVersionId: string | null;
  draftVersionId: string | null;
  /** id -> campus name, so a condition reads "The Academy GA" not a uuid. */
  schoolNames: Record<string, string>;
}

type FormRow = {
  id: string;
  organization_id: string;
  title: string;
  draft_version_id: string | null;
  published_version_id: string | null;
};

type VersionRow = {
  id: string;
  version_number: number;
  lifecycle: string;
  definition: unknown;
  created_at: string | null;
  published_at: string | null;
};

/**
 * Every form this platform holds, newest version first within each.
 *
 * One row per organization by construction (a unique index on
 * organization_id), so in practice this is one form - but reading them all
 * means a second organization appearing does not silently show the wrong one.
 */
export async function inspectInterestForms(): Promise<{
  forms: FormInspection[];
  unavailable: string | null;
}> {
  const admin = createServiceRoleClient();

  const { data: formRows, error: formError } = await admin
    .from("admissions_interest_forms" as never)
    .select("id, organization_id, title, draft_version_id, published_version_id");

  if (formError) {
    /* The refusal, not a zero. An empty list and a blocked read look identical
       from a screen, and only one of them means "there is no form". */
    return { forms: [], unavailable: `Could not read the forms: ${formError.message}` };
  }

  const forms = (formRows ?? []) as unknown as FormRow[];
  if (forms.length === 0) return { forms: [], unavailable: null };

  const orgIds = [...new Set(forms.map((f) => f.organization_id))];

  const [{ data: orgRows }, { data: versionRows, error: versionError }, { data: schoolRows }] =
    await Promise.all([
      admin.from("org_organizations" as never).select("id, name").in("id", orgIds),
      admin
        .from("admissions_interest_form_versions" as never)
        .select("id, form_id, version_number, lifecycle, definition, created_at, published_at")
        .in("form_id", forms.map((f) => f.id))
        .order("version_number", { ascending: false }),
      admin.from("schools" as never).select("id, name").in("organization_id", orgIds),
    ]);

  if (versionError) {
    return { forms: [], unavailable: `Could not read the versions: ${versionError.message}` };
  }

  const orgName = new Map(
    ((orgRows ?? []) as unknown as { id: string; name: string }[]).map((o) => [o.id, o.name])
  );

  const schoolNames: Record<string, string> = {};
  for (const s of ((schoolRows ?? []) as unknown as { id: string; name: string }[])) {
    schoolNames[s.id] = s.name;
  }

  const byForm = new Map<string, VersionRow[]>();
  for (const raw of ((versionRows ?? []) as unknown as (VersionRow & { form_id: string })[])) {
    byForm.set(raw.form_id, [...(byForm.get(raw.form_id) ?? []), raw]);
  }

  return {
    unavailable: null,
    forms: forms.map((form) => ({
      formId: form.id,
      title: form.title,
      organizationId: form.organization_id,
      organizationName: orgName.get(form.organization_id) ?? "This organization",
      publishedVersionId: form.published_version_id,
      draftVersionId: form.draft_version_id,
      schoolNames,
      versions: (byForm.get(form.id) ?? []).map((row) => {
        const definition = parseInterestFormDefinition(row.definition);
        const errors = definition ? validateInterestFormDefinition(definition) : [];
        return {
          id: row.id,
          versionNumber: row.version_number,
          lifecycle: row.lifecycle,
          createdAt: row.created_at,
          publishedAt: row.published_at,
          definition: errors.length === 0 ? definition : null,
          problem: !definition
            ? "This version's definition could not be read."
            : errors.length > 0
              ? `This version does not validate: ${errors.join("; ")}`
              : null,
        };
      }),
    })),
  };
}
