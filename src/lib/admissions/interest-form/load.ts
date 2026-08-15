/**
 * Load published Interest Form + public schools for an organization.
 */

import {
  parseInterestFormDefinition,
  validateInterestFormDefinition,
} from "@/lib/admissions/interest-form/definition";
import type {
  InterestProgramOption,
  PublishedInterestForm,
} from "@/lib/admissions/interest-form/types";
import { createServiceRoleClient } from "@/lib/supabase/server";

type FormRow = {
  id: string;
  organization_id: string;
  title: string;
  published_version_id: string | null;
};

type VersionRow = {
  id: string;
  form_id: string;
  organization_id: string;
  version_number: number;
  lifecycle: string;
  definition: unknown;
};

export async function listPublicSchoolsForOrganization(
  organizationId: string
): Promise<{ id: string; name: string }[]> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc(
    "list_schools_for_public_inquiry" as never,
    { p_organization_id: organizationId } as never
  );

  if (error) {
    console.error("[listPublicSchoolsForOrganization]", error.message);
    return [];
  }
  return (data ?? []) as { id: string; name: string }[];
}

export async function listPublicProgramsForSchool(input: {
  organizationId: string;
  schoolId: string;
}): Promise<InterestProgramOption[]> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc(
    "list_programs_for_public_inquiry" as never,
    {
      p_organization_id: input.organizationId,
      p_school_id: input.schoolId,
    } as never
  );

  if (error) {
    console.error("[listPublicProgramsForSchool]", error.message);
    return [];
  }
  return ((data ?? []) as { code: string; name: string }[]).map((row) => ({
    code: row.code,
    name: row.name,
  }));
}

/**
 * Load ONLY the resolved organization's published Interest Form.
 * Never accepts client-supplied organization_id as authority — caller must
 * pass the server-resolved organization id.
 */
export async function loadPublishedInterestForm(input: {
  organizationId: string;
  organizationName: string;
}): Promise<PublishedInterestForm | null> {
  const admin = createServiceRoleClient();

  const { data: form, error: formError } = await admin
    .from("admissions_interest_forms" as never)
    .select("id, organization_id, title, published_version_id")
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (formError) {
    console.error("[loadPublishedInterestForm] form", formError.message);
    return null;
  }

  const formRow = form as FormRow | null;
  if (!formRow?.published_version_id) return null;

  const { data: version, error: versionError } = await admin
    .from("admissions_interest_form_versions" as never)
    .select("id, form_id, organization_id, version_number, lifecycle, definition")
    .eq("id", formRow.published_version_id)
    .eq("organization_id", input.organizationId)
    .eq("lifecycle", "published")
    .maybeSingle();

  if (versionError) {
    console.error("[loadPublishedInterestForm] version", versionError.message);
    return null;
  }

  const versionRow = version as VersionRow | null;
  if (!versionRow) return null;

  const definition = parseInterestFormDefinition(versionRow.definition);
  if (!definition) return null;

  const definitionErrors = validateInterestFormDefinition(definition);
  if (definitionErrors.length) {
    console.error(
      "[loadPublishedInterestForm] invalid definition",
      definitionErrors.join("; ")
    );
    return null;
  }

  const schools = await listPublicSchoolsForOrganization(input.organizationId);

  return {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    formId: formRow.id,
    formVersionId: versionRow.id,
    versionNumber: versionRow.version_number,
    definition,
    schools,
  };
}
