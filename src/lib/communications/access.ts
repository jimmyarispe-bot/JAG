import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import type { EduRoleName } from "@/types/database";

/** Full communications access (org/school-wide announce, templates, all logs). */
export const COMMUNICATIONS_FULL_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "SCHOOL_LEADER",
] as const;

/** Create/edit student & family communications (no org-wide announce delete). */
export const COMMUNICATIONS_EDIT_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "SCHOOL_LEADER",
  "ADMISSIONS",
  "EXECUTIVE_DIRECTOR",
] as const;

export function canManageCommunications(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return ctx.roles.some((role) => COMMUNICATIONS_FULL_ROLES.includes(role));
}

export function canComposeCommunications(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageCommunications(ctx)) return true;
  if (ctx.roles.some((role) => COMMUNICATIONS_EDIT_ROLES.includes(role))) return true;
  if (ctx.roles.includes("TEACHER")) return true;
  return (
    ctx.permissions.includes("students.edit") ||
    ctx.permissions.includes("families.manage") ||
    ctx.permissions.includes("portal.messaging")
  );
}

export function canViewCommunications(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canComposeCommunications(ctx)) return true;
  return (
    ctx.permissions.includes("students.view") ||
    ctx.permissions.includes("portal.parent.access") ||
    ctx.roles.includes("PARENT") ||
    ctx.roles.includes("STUDENT") ||
    ctx.roles.includes("TEACHER")
  );
}

/** Admissions may only target students/families (not school-wide staff blasts). */
export function canAnnounceSchoolWide(ctx: IdentityContext | null | undefined): boolean {
  return canManageCommunications(ctx);
}

export function assertCanCompose(
  ctx: IdentityContext | null | undefined
): { ok: true; ctx: IdentityContext } | { ok: false; error: string } {
  if (!ctx) return { ok: false, error: "Unauthorized" };
  if (!canComposeCommunications(ctx)) {
    return { ok: false, error: "You do not have permission to compose communications." };
  }
  return { ok: true, ctx };
}

export function assertCanView(
  ctx: IdentityContext | null | undefined
): { ok: true; ctx: IdentityContext } | { ok: false; error: string } {
  if (!ctx) return { ok: false, error: "Unauthorized" };
  if (!canViewCommunications(ctx)) {
    return { ok: false, error: "You do not have permission to view communications." };
  }
  return { ok: true, ctx };
}

export async function requireComposeAccess() {
  const ctx = await getIdentityContext();
  return assertCanCompose(ctx);
}

export async function requireViewAccess() {
  const ctx = await getIdentityContext();
  return assertCanView(ctx);
}
