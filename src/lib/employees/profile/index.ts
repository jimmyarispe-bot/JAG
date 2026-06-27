import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  loadActiveSectionData,
  resolveProfile,
} from "@/lib/platform/profile/resolver";
import { buildEmployeeProfileEnvelope } from "@/lib/employees/profile/envelope";
import { EMPLOYEE_PROFILE_LEGACY_REDIRECTS } from "@/lib/employees/profile/kind";
import type { EmployeeProfileEnvelope } from "@/lib/employees/profile/types";
import type { ProfileSectionContext } from "@/lib/platform/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Parse section from URL — supports canonical `section` and legacy `tab`. */
export function parseEmployeeProfileSectionParam(searchParams: {
  section?: string;
  tab?: string;
}): string | undefined {
  if (searchParams.section) return searchParams.section;
  if (searchParams.tab) {
    return (
      EMPLOYEE_PROFILE_LEGACY_REDIRECTS[searchParams.tab] ?? searchParams.tab
    );
  }
  return undefined;
}

/** Resolve an employee profile using the platform profile registry. */
export async function resolveEmployeeProfile(
  supabase: AuthClient,
  employeeId: string,
  options?: { section?: string; tab?: string }
) {
  const identity = await getIdentityContext();
  if (!identity) return null;

  const section = parseEmployeeProfileSectionParam({
    section: options?.section,
    tab: options?.tab,
  });

  return resolveProfile("employee", employeeId, {
    section,
    supabase,
    buildEnvelope: async () =>
      buildEmployeeProfileEnvelope(supabase, employeeId, identity),
  });
}

export async function loadEmployeeSectionData(
  supabase: AuthClient,
  envelope: EmployeeProfileEnvelope,
  sectionKey: string,
  ctx: ProfileSectionContext = {}
) {
  return loadActiveSectionData("employee", envelope, sectionKey, supabase, ctx);
}

export type { EmployeeProfileEnvelope };
export { buildEmployeeProfileEnvelope } from "@/lib/employees/profile/envelope";
export { buildEmployeeProfileSectionHref } from "@/lib/employees/profile/href";
export {
  EMPLOYEE_PROFILE_KIND,
  EMPLOYEE_PROFILE_LEGACY_REDIRECTS,
} from "@/lib/employees/profile/kind";
export {
  EMPLOYEE_PROFILE_SECTIONS,
  EMPLOYEE_PROFILE_SECTION_COUNT,
} from "@/lib/employees/profile/sections";
