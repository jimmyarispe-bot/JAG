/**
 * Shared school scope for Executive Home / dashboard metric queries.
 *
 * Semantics:
 * - `null` — no app-level school filter (explicit caller override only)
 * - `[]` — no accessible schools; callers must return zeros
 * - `string[]` — filter to these school ids
 *
 * Unrestricted users (schools.access_all / org.manage / founder.override) are
 * scoped to schools in their primary organization so empty-org data surfaces
 * as zeros rather than cross-tenant platform totals.
 */
import { getIdentityContext } from "@/lib/platform/identity/context";
import { resolvePrimaryOrganizationId } from "@/lib/platform/identity/org-membership";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type SchoolScope = string[] | null;

export function hasNoSchoolAccess(schoolIds: SchoolScope): boolean {
  return schoolIds !== null && schoolIds.length === 0;
}

export function matchesSchool(
  schoolIds: SchoolScope,
  recordSchoolId: string | null | undefined
): boolean {
  if (!schoolIds) return true;
  if (schoolIds.length === 0) return false;
  if (!recordSchoolId) return false;
  return schoolIds.includes(recordSchoolId);
}

export function applySchoolFilter<
  T extends { eq: (col: string, val: string) => T; in: (col: string, vals: string[]) => T },
>(query: T, column: string, schoolIds: SchoolScope): T {
  if (!schoolIds || schoolIds.length === 0) return query;
  if (schoolIds.length === 1) return query.eq(column, schoolIds[0]);
  return query.in(column, schoolIds);
}

export interface ResolveDashboardSchoolScopeOptions {
  /**
   * Explicit override. Empty array means "all schools" (no app filter),
   * matching historical getExecutiveKPIs({ schoolIds: [] }) behavior.
   */
  schoolIds?: string[];
}

export async function resolveDashboardSchoolScope(
  supabase: AuthClient,
  options: ResolveDashboardSchoolScopeOptions = {}
): Promise<SchoolScope> {
  if (options.schoolIds !== undefined) {
    return options.schoolIds.length ? options.schoolIds : null;
  }

  const identity = await getIdentityContext();
  if (!identity) return [];

  if (!identity.hasUnrestrictedSchoolAccess) {
    return identity.accessibleSchoolIds;
  }

  const orgId = await resolvePrimaryOrganizationId(identity.effectiveUserId, supabase);
  if (!orgId) {
    return identity.accessibleSchoolIds.length ? identity.accessibleSchoolIds : [];
  }

  const { data: schools, error } = await supabase
    .from("schools")
    .select("id")
    .eq("organization_id", orgId);

  if (error) {
    return identity.accessibleSchoolIds.length ? identity.accessibleSchoolIds : [];
  }

  return (schools ?? []).map((row) => row.id);
}
