import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  loadActiveSectionData,
  resolveProfile,
} from "@/lib/platform/profile/resolver";
import { getProfileKindDefinition } from "@/lib/platform/profile/registry";
import { parseProfileSectionParam } from "@/lib/platform/profile/params";
import { buildAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/envelope";
import { ADMISSIONS_CASE_LEGACY_REDIRECTS } from "@/lib/admissions/profile/kind";
import type { AdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import type { ProfileSectionContext } from "@/lib/platform/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Resolve an admissions case profile using the platform profile registry. */
export async function resolveAdmissionsCaseProfile(
  supabase: AuthClient,
  caseId: string,
  options?: { section?: string; tab?: string }
) {
  const identity = await getIdentityContext();
  if (!identity) return null;

  const section = parseProfileSectionParam(
    { section: options?.section, tab: options?.tab },
    getProfileKindDefinition("admissions_case")?.legacySectionRedirects ??
      ADMISSIONS_CASE_LEGACY_REDIRECTS
  );

  return resolveProfile("admissions_case", caseId, {
    section,
    supabase,
    buildEnvelope: async () => buildAdmissionsCaseProfileEnvelope(supabase, caseId, identity),
  });
}

export async function loadAdmissionsCaseSectionData(
  supabase: AuthClient,
  envelope: AdmissionsCaseProfileEnvelope,
  sectionKey: string,
  ctx: ProfileSectionContext = {}
) {
  return loadActiveSectionData("admissions_case", envelope, sectionKey, supabase, ctx);
}

export type { AdmissionsCaseProfileEnvelope };
export { buildAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/envelope";
export {
  buildAdmissionsCaseHref,
  buildAdmissionsCaseSectionHref,
} from "@/lib/admissions/profile/href";
export {
  ADMISSIONS_CASE_PROFILE_KIND,
  ADMISSIONS_CASE_LEGACY_REDIRECTS,
} from "@/lib/admissions/profile/kind";
export {
  ADMISSIONS_CASE_PROFILE_SECTIONS,
  ADMISSIONS_CASE_PROFILE_SECTION_COUNT,
} from "@/lib/admissions/profile/sections";
export { canAccessAdmissionsCaseProfile } from "@/lib/admissions/profile/access";
