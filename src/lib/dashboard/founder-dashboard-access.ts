import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasIdentityPermission } from "@/lib/platform/identity/context";
import { canAccessExecutiveIntelligence } from "@/lib/executive/access";
import { canViewFi } from "@/lib/financial-intelligence/access";
import type { PermissionKey } from "@/lib/platform/identity/types";

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

const RBAC_LOG_PREFIX = "[founder-dashboard:rbac]";

function hasAnyPermission(ctx: IdentityContext, keys: PermissionKey[]): boolean {
  if (ctx.isEnterpriseAdmin) return true;
  return keys.some((key) => hasIdentityPermission(ctx, key));
}

function matchingPermissions(ctx: IdentityContext, keys: PermissionKey[]): PermissionKey[] {
  if (ctx.isEnterpriseAdmin) return keys;
  return keys.filter((key) => hasIdentityPermission(ctx, key));
}

function explainCardAccess(
  ctx: IdentityContext,
  key: FounderDashboardCardKey
): { included: boolean; reason: string } {
  if (key === "executiveAlerts") {
    const included = canAccessExecutiveIntelligence(ctx);
    const checks = {
      hasExecutiveLeadershipRole: ctx.roles.some((role) =>
        ["FOUNDER", "CEO", "EXECUTIVE_DIRECTOR", "PRESIDENT", "SUPERINTENDENT"].includes(role)
      ),
      executiveIntelligence: hasIdentityPermission(ctx, "executive.intelligence"),
      executiveDashboard: hasIdentityPermission(ctx, "executive.dashboard"),
      globalReporting: hasIdentityPermission(ctx, "global.reporting"),
      isEnterpriseAdmin: ctx.isEnterpriseAdmin,
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
      fiView: hasIdentityPermission(ctx, "fi.view"),
      fiExecutive: hasIdentityPermission(ctx, "fi.executive"),
      fiManage: hasIdentityPermission(ctx, "fi.manage"),
      financeExecutive: hasIdentityPermission(ctx, "finance.executive"),
      financeView: hasIdentityPermission(ctx, "finance.view"),
      executiveIntelligence: hasIdentityPermission(ctx, "executive.intelligence"),
      isEnterpriseAdmin: ctx.isEnterpriseAdmin,
    };
    return {
      included,
      reason: included
        ? `financial intelligence access granted (${JSON.stringify(checks)})`
        : `financial intelligence access denied (${JSON.stringify(checks)})`,
    };
  }

  const required = CARD_PERMISSIONS[key];
  if (ctx.isEnterpriseAdmin) {
    return {
      included: true,
      reason: `isEnterpriseAdmin=true bypasses permission check (needs any of ${required.join(", ")})`,
    };
  }

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
  const cardKeys = Object.keys(CARD_PERMISSIONS) as FounderDashboardCardKey[];
  const decisions = cardKeys.map((key) => ({
    card: key,
    ...explainCardAccess(ctx, key),
  }));
  const visibleCards = decisions.filter((d) => d.included).map((d) => d.card);

  console.log(RBAC_LOG_PREFIX, {
    userId: ctx.id,
    email: ctx.email,
    effectiveUserId: ctx.effectiveUserId,
    roles: ctx.roles,
    isFounder: ctx.isFounder,
    isEnterpriseAdmin: ctx.isEnterpriseAdmin,
    permissions: [...ctx.permissions].sort(),
    permissionCount: ctx.permissions.length,
    cardDecisions: decisions,
    visibleCards,
  });

  return visibleCards;
}
