import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import { canAccessExecutiveIntelligence } from "@/lib/executive/access";
import { canViewFi } from "@/lib/financial-intelligence/access";
import type { PermissionKey } from "@/lib/platform/identity/types";

/** Founder dashboard + widgets require JAG_ACCESS (granted by FOUNDER role). */
export function canViewFounderDashboard(ctx: IdentityContext): boolean {
  return hasPermission(ctx, "JAG_ACCESS");
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
