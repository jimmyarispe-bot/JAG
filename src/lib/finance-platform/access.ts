import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import type { EduRoleName } from "@/types/database";

export const FINANCE_FULL_ROLES: readonly EduRoleName[] = ["CEO", "FOUNDER"] as const;
export const FINANCE_STAFF_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "ED",
] as const;

export function canManageAllFinance(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return (
    ctx.roles.some((r) => FINANCE_FULL_ROLES.includes(r)) ||
    ctx.permissions.includes("FINANCE_ACCESS") ||
    ctx.permissions.includes("finance.manage") ||
    ctx.permissions.includes("finance.billing")
  );
}

export function canViewSchoolFinanceReporting(
  ctx: IdentityContext | null | undefined
): boolean {
  if (!ctx) return false;
  if (canManageAllFinance(ctx)) return true;
  return (
    ctx.roles.includes("SCHOOL_LEADER") ||
    ctx.permissions.includes("finance.view") ||
    ctx.permissions.includes("finance.forecast")
  );
}

export function canViewOwnFamilyFinance(
  ctx: IdentityContext | null | undefined
): boolean {
  if (!ctx) return false;
  if (canManageAllFinance(ctx) || canViewSchoolFinanceReporting(ctx)) return true;
  return (
    ctx.roles.includes("PARENT") || ctx.permissions.includes("portal.parent.access")
  );
}

/** Teachers and students have no financial access. */
export function canViewFinance(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (ctx.roles.includes("TEACHER") && !canManageAllFinance(ctx)) {
    // Pure teachers without finance permissions: no access
    if (
      !ctx.permissions.includes("FINANCE_ACCESS") &&
      !ctx.permissions.includes("finance.view") &&
      !ctx.permissions.includes("finance.billing")
    ) {
      return false;
    }
  }
  if (ctx.roles.includes("STUDENT") && !canManageAllFinance(ctx)) {
    return false;
  }
  return (
    canManageAllFinance(ctx) ||
    canViewSchoolFinanceReporting(ctx) ||
    canViewOwnFamilyFinance(ctx)
  );
}

export function canEditFinance(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return canManageAllFinance(ctx);
}

export function assertCanViewFinance(ctx: IdentityContext | null | undefined) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canViewFinance(ctx)) {
    return { ok: false as const, error: "You do not have permission to view finance." };
  }
  return { ok: true as const, ctx };
}

export function assertCanEditFinance(ctx: IdentityContext | null | undefined) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canEditFinance(ctx)) {
    return { ok: false as const, error: "You do not have permission to manage finance." };
  }
  return { ok: true as const, ctx };
}

export async function requireFinancePlatformViewAccess() {
  return assertCanViewFinance(await getIdentityContext());
}

export async function requireFinancePlatformEditAccess() {
  return assertCanEditFinance(await getIdentityContext());
}
