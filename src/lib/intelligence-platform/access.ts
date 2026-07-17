import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";

export function canViewIntelligencePlatform(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["ai.view", "ai.use", "ai.manage", "ai.admin"]);
}

export function canUseAi(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["ai.use", "ai.admin"]);
}

export function canManageAi(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["ai.manage", "ai.admin"]);
}

export function canManageProviders(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["ai.providers", "ai.admin"]);
}

export function canManagePrompts(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["ai.prompts", "ai.manage", "ai.admin"]);
}

export function canTestAi(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["ai.testing", "ai.admin"]);
}

export function canAdminAi(ctx: IdentityContext) {
  return hasPermission(ctx, "ai.admin");
}
