import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

export function canViewIntelligenceNetwork(ctx: IdentityContext) {
  return hasAnyPermission(ctx, [
    "network.view",
    "network.manage",
    "network.admin",
    "executive.intelligence",
  ]);
}

export function canManageIntelligenceNetwork(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["network.manage", "network.admin"]);
}

export function canAdminIntelligenceNetwork(ctx: IdentityContext) {
  return hasPermission(ctx, "network.admin");
}
