import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  loadActiveSectionData,
  resolveProfile,
} from "@/lib/platform/profile/resolver";
import { getProfileKindDefinition } from "@/lib/platform/profile/registry";
import { parseProfileSectionParam } from "@/lib/platform/profile/params";
import { buildFamilyProfileEnvelope } from "@/lib/families/profile/envelope";
import { FAMILY_PROFILE_LEGACY_REDIRECTS } from "@/lib/families/profile/kind";
import type { FamilyProfileEnvelope } from "@/lib/families/profile/types";
import type { ProfileSectionContext } from "@/lib/platform/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Resolve a family profile using the platform profile registry. */
export async function resolveFamilyProfile(
  supabase: AuthClient,
  familyId: string,
  options?: { section?: string; tab?: string }
) {
  const identity = await getIdentityContext();
  if (!identity) return null;

  const section = parseProfileSectionParam(
    { section: options?.section, tab: options?.tab },
    getProfileKindDefinition("family")?.legacySectionRedirects ?? FAMILY_PROFILE_LEGACY_REDIRECTS
  );

  return resolveProfile("family", familyId, {
    section,
    supabase,
    buildEnvelope: async () => buildFamilyProfileEnvelope(supabase, familyId, identity),
  });
}

export async function loadFamilySectionData(
  supabase: AuthClient,
  envelope: FamilyProfileEnvelope,
  sectionKey: string,
  ctx: ProfileSectionContext = {}
) {
  return loadActiveSectionData("family", envelope, sectionKey, supabase, ctx);
}

export type { FamilyProfileEnvelope };
export { buildFamilyProfileEnvelope } from "@/lib/families/profile/envelope";
export { buildFamilyProfileSectionHref } from "@/lib/families/profile/href";
export {
  FAMILY_PROFILE_KIND,
  FAMILY_PROFILE_LEGACY_REDIRECTS,
} from "@/lib/families/profile/kind";
export {
  FAMILY_PROFILE_SECTIONS,
  FAMILY_PROFILE_SECTION_COUNT,
} from "@/lib/families/profile/sections";
export { canAccessFamilyProfile } from "@/lib/families/profile/access";
