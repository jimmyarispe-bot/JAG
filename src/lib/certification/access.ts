import type { IdentityContext } from "@/lib/platform/identity/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { hasAnyPermission } from "@/lib/platform/identity/authorization-service";
import { userHasPermission } from "@/lib/platform/identity/permissions";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export function canViewCertification(ctx: IdentityContext) {
  return hasAnyPermission(ctx, [
    "certification.view",
    "certification.manage",
    "certification.admin",
  ]);
}

export async function requireCertificationAccess(
  supabase: AuthClient,
  ctx: IdentityContext
): Promise<boolean> {
  if (canViewCertification(ctx)) return true;

  return (
    (await userHasPermission(supabase, "certification.view", ctx.effectiveUserId)) ||
    (await userHasPermission(supabase, "certification.manage", ctx.effectiveUserId)) ||
    (await userHasPermission(supabase, "certification.admin", ctx.effectiveUserId))
  );
}

export function canManageCertification(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["certification.manage", "certification.admin"]);
}

export function canAdminCertification(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["certification.admin"]);
}
