import type { IdentityContext } from "@/lib/platform/identity/context";
import {
  hasAnyPermission,
  hasPermission,
} from "@/lib/platform/identity/authorization-service";

export function canAccessHrAdmin(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, ["hr.view", "hr.manage", "HR_ACCESS"]);
}

export function canManageHr(ctx: IdentityContext): boolean {
  return hasPermission(ctx, "hr.manage");
}

export function canRunPayroll(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, ["payroll.run", "finance.payroll", "PAYROLL_ACCESS"]);
}

export function canAccessEmployeePortal(ctx: IdentityContext): boolean {
  return hasPermission(ctx, "employee.self_service") || canAccessHrAdmin(ctx);
}
