/**
 * B.1 — Server-side tenant membership asserts (IDOR prevention).
 * Never trust client-supplied orgId/schoolId/studentId without these checks.
 */

import type { IdentityContext } from "@/lib/platform/identity/context";
import { canAccessSchool } from "@/lib/platform/identity/school-access";
import { assertOrganizationAccess as orgMembershipOk } from "@/lib/platform/identity/organizations";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type TenantAccessError = { error: "Forbidden"; code: "TENANT_SCOPE" };

export function requireSchoolAccess(
  ctx: IdentityContext,
  schoolId: string | null | undefined
): true | TenantAccessError {
  if (!schoolId) return { error: "Forbidden", code: "TENANT_SCOPE" };
  if (!canAccessSchool(ctx, schoolId)) {
    return { error: "Forbidden", code: "TENANT_SCOPE" };
  }
  return true;
}

export async function requireOrganizationAccess(
  supabase: AuthClient,
  userId: string,
  organizationId: string | null | undefined
): Promise<true | TenantAccessError> {
  if (!organizationId) return { error: "Forbidden", code: "TENANT_SCOPE" };
  const ok = await orgMembershipOk(organizationId, userId, supabase);
  if (!ok) return { error: "Forbidden", code: "TENANT_SCOPE" };
  return true;
}

/** Bind AI/API scope IDs to the session — drop unauthorized student ids. */
export function filterAccessibleStudentIds(
  requested: string[] | undefined,
  allowed: Set<string>
): string[] {
  if (!requested?.length) return [];
  return requested.filter((id) => allowed.has(id));
}
