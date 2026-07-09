import type { IdentityContext } from "@/lib/platform/identity/context";

/** Roles that receive Priorities, AI Brief, and Decisions Waiting on the founder home. */
export const EXECUTIVE_LEADERSHIP_ROLES = [
  "FOUNDER",
  "CEO",
  "EXECUTIVE_DIRECTOR",
  "PRESIDENT",
  "SUPERINTENDENT",
] as const;

export function hasExecutiveLeadershipRole(ctx: IdentityContext): boolean {
  return ctx.roles.some((role) =>
    (EXECUTIVE_LEADERSHIP_ROLES as readonly string[]).includes(role)
  );
}

export function canAccessExecutiveIntelligence(ctx: IdentityContext): boolean {
  return (
    hasExecutiveLeadershipRole(ctx) ||
    ctx.permissions.includes("executive.intelligence") ||
    ctx.permissions.includes("executive.dashboard") ||
    ctx.permissions.includes("global.reporting") ||
    ctx.isEnterpriseAdmin
  );
}

export function canAccessBoardReports(ctx: IdentityContext): boolean {
  return (
    ctx.permissions.includes("executive.board_reports") ||
    ctx.permissions.includes("global.reporting") ||
    ctx.permissions.includes("finance.export") ||
    ctx.isEnterpriseAdmin
  );
}

export function canAccessStrategicPlanning(ctx: IdentityContext): boolean {
  return ctx.permissions.includes("executive.strategic") || ctx.isEnterpriseAdmin;
}

export function canAccessRiskIntelligence(ctx: IdentityContext): boolean {
  return (
    ctx.permissions.includes("executive.risk_view") ||
    ctx.permissions.includes("executive.intelligence") ||
    ctx.isEnterpriseAdmin
  );
}
