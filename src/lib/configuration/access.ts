import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

export function canViewConfiguration(ctx: IdentityContext) {
  return hasAnyPermission(ctx, [
    "configuration.view",
    "configuration.manage",
    "configuration.admin",
    "org.view",
    "school.configure",
    "SYSTEM_ADMIN_ACCESS",
  ]);
}

export function canManageConfiguration(ctx: IdentityContext) {
  return hasAnyPermission(ctx, [
    "configuration.manage",
    "configuration.admin",
    "school.configure",
  ]);
}

export function canAdminConfiguration(ctx: IdentityContext) {
  return hasPermission(ctx, "configuration.admin");
}

export function canLaunchOrganization(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["configuration.launch", "configuration.admin"]);
}
