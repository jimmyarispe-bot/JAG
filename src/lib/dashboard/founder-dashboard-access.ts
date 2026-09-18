import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import { canAccessExecutiveIntelligence } from "@/lib/executive/access";
import { canViewFi } from "@/lib/financial-intelligence/access";
import type { PermissionKey } from "@/lib/platform/identity/types";

/**
 * The founder dashboard requires being the founder.
 *
 * It used to require the JAG_ACCESS permission, on the belief that JAG_ACCESS
 * is "granted by FOUNDER role" - which is true and is not the whole truth.
 * PLATFORM_OWNER and JAG_ORG_ADMIN grant it too, so Danni Treu, whose operating
 * role is Executive Director of Schools, signed in every morning to a
 * revenue-first founder brief that was never meant for her.
 *
 * A permission that two administration roles also carry cannot answer "is this
 * the founder". The role can, and this screen is named after it.
 *
 * NOT a money boundary. Danni keeps every finance key she holds and Finance is
 * one click away in the sidebar; what changes is that the founder's own morning
 * brief is the founder's. See lib/dashboard/landing.ts for where she lands
 * instead.
 */
export function canViewFounderDashboard(ctx: IdentityContext): boolean {
  const held = (ctx.roles ?? []).map((role) => String(role).toUpperCase());
  return held.includes("FOUNDER");
}

export type FounderDashboardCardKey =
  | "activeEnrollment"
  | "admissionsPipeline"
  | "monthlyRevenue"
  | "tuitionOutstanding"
  | "staffCount"
  | "teacherAttendance"
  | "studentAttendance"
  | "upcomingClasses"
  | "executiveAlerts"
  | "financialIntelligence";

const CARD_PERMISSIONS: Record<FounderDashboardCardKey, PermissionKey[]> = {
  activeEnrollment: ["students.view"],
  admissionsPipeline: ["admissions.view", "admissions.manage", "admissions.accept"],
  monthlyRevenue: ["finance.view"],
  tuitionOutstanding: ["finance.view"],
  staffCount: ["hr.view", "hr.manage"],
  teacherAttendance: [
    "instruction.executive",
    "scheduling.executive",
    "hr.view",
    "ai.teacher",
  ],
  studentAttendance: ["students.view", "students.edit"],
  upcomingClasses: ["scheduling.executive", "instruction.executive", "hr.view", "ai.teacher"],
  executiveAlerts: ["executive.intelligence", "executive.dashboard", "global.reporting"],
  financialIntelligence: ["finance.view", "fi.view", "fi.executive"],
};

function matchingPermissions(ctx: IdentityContext, keys: PermissionKey[]): PermissionKey[] {
  if (!canViewFounderDashboard(ctx)) return [];
  return keys.filter((key) => hasPermission(ctx, key));
}

function explainCardAccess(
  ctx: IdentityContext,
  key: FounderDashboardCardKey
): { included: boolean; reason: string } {
  if (!canViewFounderDashboard(ctx)) {
    return { included: false, reason: "JAG_ACCESS permission required" };
  }

  if (key === "executiveAlerts") {
    const included = canAccessExecutiveIntelligence(ctx);
    const checks = {
      executiveIntelligence: hasPermission(ctx, "executive.intelligence"),
      executiveDashboard: hasPermission(ctx, "executive.dashboard"),
      globalReporting: hasPermission(ctx, "global.reporting"),
    };
    return {
      included,
      reason: included
        ? `executive access granted (${JSON.stringify(checks)})`
        : `executive access denied (${JSON.stringify(checks)})`,
    };
  }

  if (key === "financialIntelligence") {
    const included = canViewFi(ctx);
    const checks = {
      fiView: hasPermission(ctx, "fi.view"),
      fiExecutive: hasPermission(ctx, "fi.executive"),
      fiManage: hasPermission(ctx, "fi.manage"),
      financeExecutive: hasPermission(ctx, "finance.executive"),
      financeView: hasPermission(ctx, "finance.view"),
      executiveIntelligence: hasPermission(ctx, "executive.intelligence"),
    };
    return {
      included,
      reason: included
        ? `financial intelligence access granted (${JSON.stringify(checks)})`
        : `financial intelligence access denied (${JSON.stringify(checks)})`,
    };
  }

  const required = CARD_PERMISSIONS[key];
  const matched = matchingPermissions(ctx, required);
  if (matched.length > 0) {
    return {
      included: true,
      reason: `matched permissions: ${matched.join(", ")} (needs any of ${required.join(", ")})`,
    };
  }

  return {
    included: false,
    reason: `no matching permission (needs any of ${required.join(", ")})`,
  };
}

export function canViewFounderDashboardCard(
  ctx: IdentityContext,
  key: FounderDashboardCardKey
): boolean {
  return explainCardAccess(ctx, key).included;
}

export function getVisibleFounderDashboardCards(ctx: IdentityContext): FounderDashboardCardKey[] {
  if (!canViewFounderDashboard(ctx)) {
    return [];
  }

  const cardKeys = Object.keys(CARD_PERMISSIONS) as FounderDashboardCardKey[];
  return cardKeys.filter((key) => explainCardAccess(ctx, key).included);
}
