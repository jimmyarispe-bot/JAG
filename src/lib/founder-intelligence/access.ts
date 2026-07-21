import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import type { EduRoleName } from "@/types/database";

/** Full Founder Intelligence — Founder / JAG only by default. */
export const FOUNDER_FULL_ROLES: readonly EduRoleName[] = ["FOUNDER"] as const;

/** Configurable executive access (CEO / ED) when granted executive.intelligence. */
export const FOUNDER_CONFIGURABLE_ROLES: readonly EduRoleName[] = [
  "CEO",
  "EXECUTIVE_DIRECTOR",
] as const;

export function canManageFounderIntelligence(
  ctx: IdentityContext | null | undefined
): boolean {
  if (!ctx) return false;
  if (ctx.isFounder || ctx.permissions.includes("JAG_ACCESS")) return true;
  if (ctx.roles.some((r) => FOUNDER_FULL_ROLES.includes(r))) return true;
  if (
    ctx.permissions.includes("founder.intelligence") ||
    ctx.permissions.includes("founder.override")
  ) {
    return true;
  }
  return false;
}

/**
 * View access: Founder full, or CEO/ED with executive.intelligence (configurable),
 * or explicit founder.view / founder.intelligence grant.
 */
export function canViewFounderIntelligence(
  ctx: IdentityContext | null | undefined
): boolean {
  if (!ctx) return false;
  if (canManageFounderIntelligence(ctx)) return true;

  const hasExplicit =
    ctx.permissions.includes("founder.view") ||
    ctx.permissions.includes("founder.intelligence");
  if (hasExplicit) return true;

  const isConfigurableRole = ctx.roles.some((r) =>
    FOUNDER_CONFIGURABLE_ROLES.includes(r)
  );
  if (
    isConfigurableRole &&
    (ctx.permissions.includes("executive.intelligence") ||
      ctx.permissions.includes("executive.dashboard"))
  ) {
    return true;
  }

  return false;
}

export function canDecideFounderIntelligence(
  ctx: IdentityContext | null | undefined
): boolean {
  return canManageFounderIntelligence(ctx);
}

export function assertCanViewFounderIntelligence(
  ctx: IdentityContext | null | undefined
) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canViewFounderIntelligence(ctx)) {
    return {
      ok: false as const,
      error: "You do not have permission to view Founder Intelligence.",
    };
  }
  return { ok: true as const, ctx };
}

export function assertCanDecideFounderIntelligence(
  ctx: IdentityContext | null | undefined
) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canDecideFounderIntelligence(ctx)) {
    return {
      ok: false as const,
      error: "You do not have permission to record Founder decisions.",
    };
  }
  return { ok: true as const, ctx };
}

export async function requireFounderIntelligenceView() {
  return assertCanViewFounderIntelligence(await getIdentityContext());
}

export async function requireFounderIntelligenceDecide() {
  return assertCanDecideFounderIntelligence(await getIdentityContext());
}
