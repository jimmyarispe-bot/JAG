import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

export function canViewCompliance(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, [
    "compliance.view",
    "compliance.manage",
    "compliance.admin",
    "executive.intelligence",
  ]);
}

export function canManageCompliance(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, ["compliance.manage", "compliance.admin"]);
}

export function canAdminCompliance(ctx: IdentityContext): boolean {
  return hasPermission(ctx, "compliance.admin");
}

export function canExportComplianceReports(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, [
    "compliance.reports",
    "compliance.admin",
    "global.reporting",
  ]);
}
