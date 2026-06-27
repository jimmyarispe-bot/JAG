import type { IdentityContext } from "@/lib/platform/identity/context";

/** Whether the user may access records in any school (enterprise-wide roles). */
export function hasUnrestrictedSchoolAccess(ctx: IdentityContext): boolean {
  return ctx.hasUnrestrictedSchoolAccess;
}

/** Whether the user may access a specific school. */
export function canAccessSchool(ctx: IdentityContext, schoolId: string): boolean {
  if (ctx.hasUnrestrictedSchoolAccess) return true;
  return ctx.accessibleSchoolIds.includes(schoolId);
}

/**
 * Resolve a school id from form input or the user's primary assignment.
 * Returns null when no accessible school can be determined.
 */
export function resolvePrimarySchoolId(
  ctx: IdentityContext,
  formSchoolId?: string | null
): string | null {
  const candidates = [
    formSchoolId,
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id,
    ...ctx.accessibleSchoolIds,
    ctx.orgAssignments[0]?.school_id,
  ].filter((id): id is string => Boolean(id));

  for (const schoolId of candidates) {
    if (canAccessSchool(ctx, schoolId)) return schoolId;
  }
  return null;
}
