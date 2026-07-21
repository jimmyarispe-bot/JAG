import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import type { EduRoleName } from "@/types/database";

export const DOCUMENTS_FULL_ROLES: readonly EduRoleName[] = ["CEO", "FOUNDER"] as const;
export const DOCUMENTS_SCHOOL_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "SCHOOL_LEADER",
] as const;

export function canManageAllDocuments(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return ctx.roles.some((r) => DOCUMENTS_FULL_ROLES.includes(r));
}

export function canManageSchoolDocuments(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageAllDocuments(ctx)) return true;
  return ctx.roles.some((r) => DOCUMENTS_SCHOOL_ROLES.includes(r));
}

export function canEditDocuments(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageSchoolDocuments(ctx)) return true;
  if (ctx.roles.includes("TEACHER")) return true;
  if (ctx.roles.includes("HR")) return true;
  if (ctx.roles.includes("ADMISSIONS")) return true;
  return (
    ctx.permissions.includes("students.view") ||
    ctx.permissions.includes("hr.view") ||
    ctx.permissions.includes("finance.view")
  );
}

export function canViewDocuments(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canEditDocuments(ctx)) return true;
  return (
    ctx.roles.includes("PARENT") ||
    ctx.roles.includes("STUDENT") ||
    ctx.permissions.includes("portal.parent.access")
  );
}

export function canManageHrDocuments(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageSchoolDocuments(ctx)) return true;
  return ctx.roles.includes("HR") || ctx.permissions.includes("hr.view");
}

export function canManageFinanceDocuments(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageSchoolDocuments(ctx)) return true;
  return ctx.permissions.includes("finance.view") || ctx.permissions.includes("finance.manage");
}

export function assertCanView(ctx: IdentityContext | null | undefined) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canViewDocuments(ctx)) {
    return { ok: false as const, error: "You do not have permission to view documents." };
  }
  return { ok: true as const, ctx };
}

export function assertCanEdit(ctx: IdentityContext | null | undefined) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canEditDocuments(ctx)) {
    return { ok: false as const, error: "You do not have permission to edit documents." };
  }
  return { ok: true as const, ctx };
}

export async function requireDocumentsViewAccess() {
  return assertCanView(await getIdentityContext());
}

export async function requireDocumentsEditAccess() {
  return assertCanEdit(await getIdentityContext());
}
