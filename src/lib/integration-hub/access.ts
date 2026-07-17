import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

export function canViewIntegrationHub(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, [
    "integration.view",
    "integration.manage",
    "integration.admin",
    "integration.developer",
    "integration.marketplace",
    "integration.operations",
    "integration.security",
    "developer.portal",
    "data.view",
  ]);
}

export function canManageIntegrationHub(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, ["integration.manage", "integration.admin"]);
}

export function canAdminIntegrationHub(ctx: IdentityContext): boolean {
  return hasPermission(ctx, "integration.admin");
}

export function canAccessDeveloperPortal(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, [
    "integration.developer",
    "developer.portal",
    "integration.admin",
  ]);
}

export function canAccessMarketplace(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, ["integration.marketplace", "integration.admin"]);
}

export function canAccessOperations(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, ["integration.operations", "integration.admin"]);
}

export function canAccessIntegrationSecurity(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, ["integration.security", "integration.admin"]);
}
