import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

const CLOUD_PERMS = [
  "cloud.admin",
  "cloud.support",
  "cloud.operations",
  "cloud.sales",
  "cloud.finance",
  "cloud.engineering",
  "cloud.analytics",
] as const;

export function canAccessCloudConsole(ctx: IdentityContext) {
  return hasAnyPermission(ctx, CLOUD_PERMS);
}

export function canAdminCloud(ctx: IdentityContext) {
  return hasPermission(ctx, "cloud.admin");
}

export function canCloudSupport(ctx: IdentityContext) {
  return hasPermission(ctx, "cloud.support") || canAdminCloud(ctx);
}

export function canCloudSales(ctx: IdentityContext) {
  return hasPermission(ctx, "cloud.sales") || canAdminCloud(ctx);
}

export function canCloudFinance(ctx: IdentityContext) {
  return hasPermission(ctx, "cloud.finance") || canAdminCloud(ctx);
}

export function canCloudOperations(ctx: IdentityContext) {
  return hasPermission(ctx, "cloud.operations") || canAdminCloud(ctx);
}

export function canCloudEngineering(ctx: IdentityContext) {
  return hasPermission(ctx, "cloud.engineering") || canAdminCloud(ctx);
}

export function canCloudAnalytics(ctx: IdentityContext) {
  return hasPermission(ctx, "cloud.analytics") || canAdminCloud(ctx);
}
