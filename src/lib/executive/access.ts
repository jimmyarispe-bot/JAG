import type { IdentityContext } from "@/lib/platform/identity/context";
import {
  hasAnyPermission,
  hasPermission,
} from "@/lib/platform/identity/authorization-service";

export function canAccessExecutiveIntelligence(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, [
    "executive.intelligence",
    "executive.dashboard",
    "global.reporting",
  ]);
}

export function canAccessBoardReports(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, [
    "executive.board_reports",
    "global.reporting",
    "finance.export",
    "SYSTEM_ADMIN_ACCESS",
  ]);
}

export function canAccessStrategicPlanning(ctx: IdentityContext): boolean {
  return (
    hasPermission(ctx, "executive.strategic") ||
    hasPermission(ctx, "SYSTEM_ADMIN_ACCESS")
  );
}

export function canAccessRiskIntelligence(ctx: IdentityContext): boolean {
  return hasAnyPermission(ctx, [
    "executive.risk_view",
    "executive.intelligence",
    "SYSTEM_ADMIN_ACCESS",
  ]);
}

/** @deprecated Use canAccessExecutiveIntelligence — role checks are forbidden. */
export function hasExecutiveLeadershipRole(ctx: IdentityContext): boolean {
  return canAccessExecutiveIntelligence(ctx);
}

/** @deprecated Role lists must not be used for authorization. */
export const EXECUTIVE_LEADERSHIP_ROLES = [] as const;
