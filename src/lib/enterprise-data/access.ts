import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

export function canViewDataPlatform(ctx: IdentityContext) {
  return hasAnyPermission(ctx, [
    "data.view",
    "data.manage",
    "data.import",
    "data.export",
    "data.admin",
    "fi.import",
  ]);
}

export function canImportData(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["data.import", "data.admin"]);
}

export function canExportData(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["data.export", "data.admin"]);
}

export function canManageDataPlatform(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["data.manage", "data.admin"]);
}

export function canAdminDataPlatform(ctx: IdentityContext) {
  return hasPermission(ctx, "data.admin");
}
