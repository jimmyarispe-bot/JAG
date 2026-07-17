import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

export function canViewFi(ctx: IdentityContext) {
  return hasAnyPermission(ctx, [
    "fi.view",
    "fi.executive",
    "fi.manage",
    "finance.executive",
    "finance.view",
    "executive.intelligence",
    "FINANCE_ACCESS",
  ]);
}

export function canManageFi(ctx: IdentityContext) {
  return hasPermission(ctx, "fi.manage");
}

export function canRunScenarios(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["fi.scenarios", "fi.executive", "fi.manage"]);
}

export function canImportFi(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["fi.import", "fi.manage"]);
}
