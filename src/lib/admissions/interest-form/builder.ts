/**
 * What the form builder reads.
 *
 * WHY THIS EXISTS. The interest-form engine carries all four campus
 * applications, and the only way anybody has ever changed one is a migration -
 * which is how it reached version 22. Jimmy, 25 September: "i want/need to be
 * able to go into the jag to fix/edit/create anything i need to at any time."
 *
 * This is the read side, and only the read side. Nothing here writes, opens a
 * draft or publishes; those come next and go through the lifecycle functions
 * already written and tested in versioning.ts.
 *
 * SERVICE ROLE, DELIBERATELY. The definition is not tenant-readable through
 * RLS for a staff session, and this module is only ever reached behind the
 * FORM_BUILDER_ACCESS gate on the page and the action. The organization id is
 * resolved server-side and never taken from the caller - the same rule
 * load.ts states for the public path.
 */

import { parseInterestFormDefinition } from "@/lib/admissions/interest-form/definition";
import { listPublicSchoolsForOrganization } from "@/lib/admissions/interest-form/load";
import type { InterestFormDefinition } from "@/lib/admissions/interest-form/types";
import { createServiceRoleClient } from "@/lib/supabase/server";

export interface BuilderVersionSummary {
  readonly id: string;
  readonly versionNumber: number;
  readonly lifecycle: string;
  readonly isPublished: boolean;
  readonly isDraft: boolean;
}

export interface BuilderForm {
  readonly formId: string;
  readonly title: string;
  readonly publishedVersionId: string | null;
  readonly draftVersionId: string | null;
  readonly publishedVersionNumber: number | null;
  /** The live definition, or null when nothing is published. */
  readonly definition: InterestFormDefinition | null;
  /** Newest first. */
  readonly versions: readonly BuilderVersionSummary[];
  /** School id → name, for rendering campus conditions in words. */
  readonly schoolNames: Readonly<Record<string, string>>;
}

type FormRow = {
  id: string;
  title: string | null;
  published_version_id: string | null;
  draft_version_id: string | null;
};

type VersionRow = {
  id: string;
  version_number: number;
  lifecycle: string;
  definition: unknown;
};

export async function loadFormForBuilder(
  organizationId: string
): Promise<BuilderForm | null> {
  const admin = createServiceRoleClient();

  const { data: form, error: formError } = await admin
    .from("admissions_interest_forms" as never)
    .select("id, title, published_version_id, draft_version_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (formError) {
    console.error("[loadFormForBuilder] form", formError.message);
    return null;
  }

  const formRow = form as FormRow | null;
  if (!formRow) return null;

  /*
   * Every version, not just the published one. A builder that cannot show you
   * the history is a builder you cannot trust to publish - the first question
   * anybody asks after pressing publish is "what did it look like before".
   */
  const { data: versions, error: versionsError } = await admin
    .from("admissions_interest_form_versions" as never)
    .select("id, version_number, lifecycle, definition")
    .eq("form_id", formRow.id)
    .eq("organization_id", organizationId)
    .order("version_number", { ascending: false });

  if (versionsError) {
    console.error("[loadFormForBuilder] versions", versionsError.message);
    return null;
  }

  const rows = (versions ?? []) as unknown as VersionRow[];
  const live = rows.find((v) => v.id === formRow.published_version_id) ?? null;

  const schools = await listPublicSchoolsForOrganization(organizationId);
  const schoolNames: Record<string, string> = {};
  for (const school of schools) schoolNames[school.id] = school.name;

  return {
    formId: formRow.id,
    title: (formRow.title ?? "").trim() || "Untitled form",
    publishedVersionId: formRow.published_version_id,
    draftVersionId: formRow.draft_version_id,
    publishedVersionNumber: live?.version_number ?? null,
    /*
     * Parsed, not validated. loadPublishedInterestForm returns null on a
     * definition that fails validation, which is right for a family - better
     * no form than a broken one. It is wrong here: a definition the engine
     * rejects is exactly what somebody needs to open the builder to SEE.
     */
    definition: live ? parseInterestFormDefinition(live.definition) : null,
    versions: rows.map((v) => ({
      id: v.id,
      versionNumber: v.version_number,
      lifecycle: v.lifecycle,
      isPublished: v.id === formRow.published_version_id,
      isDraft: v.id === formRow.draft_version_id,
    })),
    schoolNames,
  };
}
