import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import type { EduRoleName } from "@/types/database";

/** Roles allowed to archive / delete / restore students (RC1). */
export const STUDENT_LIFECYCLE_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "SCHOOL_LEADER",
] as const;

export function canManageStudentLifecycle(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return ctx.roles.some((role) => STUDENT_LIFECYCLE_ROLES.includes(role));
}

export function assertCanManageStudentLifecycle(
  ctx: IdentityContext | null | undefined
): { ok: true; ctx: IdentityContext } | { ok: false; error: string } {
  if (!ctx) return { ok: false, error: "Unauthorized" };
  if (!canManageStudentLifecycle(ctx)) {
    return {
      ok: false,
      error: "Only CEO or School Leader can archive or delete students.",
    };
  }
  return { ok: true, ctx };
}

export async function requireStudentLifecycleAccess() {
  const ctx = await getIdentityContext();
  return assertCanManageStudentLifecycle(ctx);
}
