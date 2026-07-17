import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

export function canViewWork(ctx: IdentityContext) {
  return hasAnyPermission(ctx, [
    "work.view",
    "work.manage",
    "work.admin",
    "work.executive",
  ]);
}

export function canManageWork(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["work.manage", "work.admin"]);
}

export function canAdminWork(ctx: IdentityContext) {
  return hasPermission(ctx, "work.admin");
}

export function canViewWorkReports(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["work.reports", "work.executive", "work.admin"]);
}
