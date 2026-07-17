import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

const OPS_PERMS = [
  "operations.view",
  "operations.manage",
  "operations.executive",
  "operations.security",
  "operations.support",
  "operations.billing",
  "operations.analytics",
  "operations.partners",
  "cloud.admin",
  "cloud.operations",
] as const;

export function canAccessOperationsCenter(ctx: IdentityContext) {
  return hasAnyPermission(ctx, OPS_PERMS);
}

export function canManageOperations(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["operations.manage", "cloud.admin"]);
}

export function canOperationsExecutive(ctx: IdentityContext) {
  return hasPermission(ctx, "operations.executive") || canManageOperations(ctx);
}

export function canOperationsSecurity(ctx: IdentityContext) {
  return hasPermission(ctx, "operations.security") || canManageOperations(ctx);
}

export function canOperationsSupport(ctx: IdentityContext) {
  return (
    hasPermission(ctx, "operations.support") ||
    canManageOperations(ctx) ||
    hasPermission(ctx, "cloud.support")
  );
}

export function canOperationsBilling(ctx: IdentityContext) {
  return (
    hasPermission(ctx, "operations.billing") ||
    canManageOperations(ctx) ||
    hasPermission(ctx, "cloud.finance")
  );
}

export function canOperationsAnalytics(ctx: IdentityContext) {
  return (
    hasPermission(ctx, "operations.analytics") ||
    canManageOperations(ctx) ||
    hasPermission(ctx, "cloud.analytics")
  );
}

export function canOperationsPartners(ctx: IdentityContext) {
  return hasPermission(ctx, "operations.partners") || canManageOperations(ctx);
}
