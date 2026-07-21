import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import type { EduRoleName } from "@/types/database";

/** Full family lifecycle (archive/delete/merge/split). */
export const FAMILY_LIFECYCLE_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "SCHOOL_LEADER",
] as const;

/** Create / edit families and guardians (no hard delete). */
export const FAMILY_EDIT_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "SCHOOL_LEADER",
  "ADMISSIONS",
  "EXECUTIVE_DIRECTOR",
] as const;

export function canManageFamilyLifecycle(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return ctx.roles.some((role) => FAMILY_LIFECYCLE_ROLES.includes(role));
}

export function canEditFamilies(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageFamilyLifecycle(ctx)) return true;
  if (ctx.roles.some((role) => FAMILY_EDIT_ROLES.includes(role))) return true;
  return (
    ctx.permissions.includes("families.manage") || ctx.permissions.includes("students.edit")
  );
}

export function canViewFamilies(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canEditFamilies(ctx)) return true;
  return (
    ctx.permissions.includes("students.view") ||
    ctx.permissions.includes("portal.parent.access") ||
    ctx.roles.includes("TEACHER") ||
    ctx.roles.includes("PARENT")
  );
}

export function assertCanManageFamilyLifecycle(
  ctx: IdentityContext | null | undefined
): { ok: true; ctx: IdentityContext } | { ok: false; error: string } {
  if (!ctx) return { ok: false, error: "Unauthorized" };
  if (!canManageFamilyLifecycle(ctx)) {
    return {
      ok: false,
      error: "Only CEO or School Leader can archive or delete families.",
    };
  }
  return { ok: true, ctx };
}

export function assertCanEditFamilies(
  ctx: IdentityContext | null | undefined
): { ok: true; ctx: IdentityContext } | { ok: false; error: string } {
  if (!ctx) return { ok: false, error: "Unauthorized" };
  if (!canEditFamilies(ctx)) {
    return { ok: false, error: "You do not have permission to edit families." };
  }
  return { ok: true, ctx };
}

export async function requireFamilyLifecycleAccess() {
  const ctx = await getIdentityContext();
  return assertCanManageFamilyLifecycle(ctx);
}

export async function requireFamilyEditAccess() {
  const ctx = await getIdentityContext();
  return assertCanEditFamilies(ctx);
}
