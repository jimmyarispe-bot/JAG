import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  loadActiveSectionData,
  resolveProfile,
} from "@/lib/platform/profile/resolver";
import { getProfileKindDefinition } from "@/lib/platform/profile/registry";
import { buildStudentProfileEnvelope } from "@/lib/students/profile/envelope";
import { STUDENT_PROFILE_LEGACY_REDIRECTS } from "@/lib/students/profile/kind";
import type { StudentProfileEnvelope } from "@/lib/students/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Parse section from URL search params — supports canonical `section` and legacy `tab`. */
export function parseProfileSectionParam(
  searchParams: { section?: string; tab?: string },
  legacyRedirects?: Record<string, string>
): string | undefined {
  if (searchParams.section) return searchParams.section;
  if (searchParams.tab) {
    return legacyRedirects?.[searchParams.tab] ?? searchParams.tab;
  }
  return undefined;
}

/** Resolve a student profile using the platform profile registry. */
export async function resolveStudentProfile(
  supabase: AuthClient,
  studentId: string,
  options?: { section?: string; tab?: string }
) {
  const identity = await getIdentityContext();
  if (!identity) return null;

  const section = parseProfileSectionParam(
    { section: options?.section, tab: options?.tab },
    getProfileKindDefinition("student")?.legacySectionRedirects ??
      STUDENT_PROFILE_LEGACY_REDIRECTS
  );

  return resolveProfile("student", studentId, {
    section,
    supabase,
    buildEnvelope: async () => buildStudentProfileEnvelope(supabase, studentId, identity),
  });
}

export async function loadStudentSectionData(
  supabase: AuthClient,
  envelope: StudentProfileEnvelope,
  sectionKey: string,
  ctx: Record<string, unknown> = {}
) {
  return loadActiveSectionData("student", envelope, sectionKey, supabase, ctx);
}

export type { StudentProfileEnvelope };
export { buildStudentProfileEnvelope } from "@/lib/students/profile/envelope";
export { STUDENT_PROFILE_KIND, STUDENT_PROFILE_LEGACY_REDIRECTS } from "@/lib/students/profile/kind";
export { STUDENT_PROFILE_SECTIONS } from "@/lib/students/profile/sections";
