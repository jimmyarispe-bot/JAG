import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import { canAccessSchool } from "@/lib/platform/identity/school-access";
import type { EduRoleName } from "@/types/database";

/** Roles explicitly allowed to run student bulk import (Phase 9). */
export const STUDENT_IMPORT_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "EXECUTIVE_DIRECTOR",
  "SCHOOL_LEADER",
  "ADMISSIONS",
] as const;

export function canImportStudents(ctx: IdentityContext | null): boolean {
  if (!ctx) return false;
  const hasRole = ctx.roles.some((role) => STUDENT_IMPORT_ROLES.includes(role));
  const hasPermission = ctx.permissions.includes("students.edit");
  return hasRole && hasPermission;
}

export function assertCanImportStudents(
  ctx: IdentityContext | null
): { ok: true; ctx: IdentityContext } | { ok: false; error: string } {
  if (!ctx) return { ok: false, error: "Unauthorized" };
  if (!canImportStudents(ctx)) {
    return {
      ok: false,
      error: "Only CEO, Executive Director, School Leader, or Admissions can import students.",
    };
  }
  return { ok: true, ctx };
}

export function assertSchoolImportAccess(
  ctx: IdentityContext,
  schoolId: string
): { ok: true } | { ok: false; error: string } {
  if (!canAccessSchool(ctx, schoolId)) {
    return {
      ok: false,
      error: "School Leaders may only import into assigned schools.",
    };
  }
  return { ok: true };
}

export async function requireStudentImportAccess() {
  const ctx = await getIdentityContext();
  return assertCanImportStudents(ctx);
}
