import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import {
  canAccessEmployeePortal,
  canAccessHrAdmin,
  canManageHr,
  canRunPayroll,
} from "@/lib/hr/access";
import type { EduRoleName } from "@/types/database";

export {
  canAccessHrAdmin,
  canManageHr,
  canRunPayroll,
  canAccessEmployeePortal,
};

export const HCM_FULL_ROLES: readonly EduRoleName[] = ["CEO", "FOUNDER"] as const;

export function canManageAllHcm(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return (
    ctx.roles.some((r) => HCM_FULL_ROLES.includes(r)) ||
    canManageHr(ctx) ||
    ctx.permissions.includes("HR_ACCESS")
  );
}

export function canViewSchoolEmployees(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageAllHcm(ctx)) return true;
  return (
    ctx.roles.includes("SCHOOL_LEADER") ||
    ctx.permissions.includes("hr.view") ||
    canAccessHrAdmin(ctx)
  );
}

/** Teachers: own profile only (portal). */
export function canViewOwnEmployeeProfile(
  ctx: IdentityContext | null | undefined
): boolean {
  if (!ctx) return false;
  if (canViewSchoolEmployees(ctx)) return true;
  return (
    ctx.roles.includes("TEACHER") ||
    canAccessEmployeePortal(ctx)
  );
}

/** Finance: payroll-related only. */
export function canViewPayrollInfo(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageAllHcm(ctx)) return true;
  return canRunPayroll(ctx) || ctx.permissions.includes("finance.payroll");
}

export function canEditHcm(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return canManageAllHcm(ctx);
}

export function assertCanViewHcm(ctx: IdentityContext | null | undefined) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canViewSchoolEmployees(ctx) && !canViewOwnEmployeeProfile(ctx)) {
    return { ok: false as const, error: "You do not have permission to view HR." };
  }
  return { ok: true as const, ctx };
}

export function assertCanEditHcm(ctx: IdentityContext | null | undefined) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canEditHcm(ctx)) {
    return { ok: false as const, error: "You do not have permission to manage HR." };
  }
  return { ok: true as const, ctx };
}

export async function requireHcmViewAccess() {
  return assertCanViewHcm(await getIdentityContext());
}

export async function requireHcmEditAccess() {
  return assertCanEditHcm(await getIdentityContext());
}
