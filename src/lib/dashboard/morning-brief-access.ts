import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";
import { canAccessExecutiveIntelligence } from "@/lib/executive/access";
import { canViewFounderDashboard } from "@/lib/dashboard/founder-dashboard-access";
import type { DashboardMetrics } from "@/lib/dashboard/metrics";
import type { ModuleId } from "@/lib/dashboard/navigation";
import { FOUNDERS_QUICK_LAUNCH_MODULE_IDS } from "@/lib/dashboard/founders-navigation";
import type { PermissionKey } from "@/lib/platform/identity/types";

export type MorningBriefMetricKey = keyof DashboardMetrics;

const METRIC_PERMISSIONS: Record<MorningBriefMetricKey, PermissionKey[]> = {
  enrollment: ["students.view"],
  activeStudents: ["students.view"],
  admissionsPipeline: ["admissions.view", "admissions.manage", "admissions.accept"],
  scholarshipsAwarded: ["scholarships.view"],
  employees: ["hr.view", "hr.manage"],
  revenue: ["finance.view"],
};

const QUICK_LAUNCH_PERMISSIONS: Record<
  (typeof FOUNDERS_QUICK_LAUNCH_MODULE_IDS)[number],
  PermissionKey[]
> = {
  admissions: ["admissions.view", "admissions.manage", "admissions.accept"],
  students: ["students.view"],
  scheduling: ["hr.view", "scheduling.executive"],
  teacher: ["ai.teacher", "instruction.executive", "hr.view", "students.view"],
  finance: ["finance.view"],
  hr: ["hr.view", "hr.manage", "employee.self_service"],
};

export function canViewMorningBriefMetric(
  ctx: IdentityContext,
  key: MorningBriefMetricKey
): boolean {
  return hasAnyPermission(ctx, METRIC_PERMISSIONS[key]);
}

export function getVisibleMorningBriefMetrics(ctx: IdentityContext): MorningBriefMetricKey[] {
  return (Object.keys(METRIC_PERMISSIONS) as MorningBriefMetricKey[]).filter((key) =>
    canViewMorningBriefMetric(ctx, key)
  );
}

export function canViewQuickLaunchModule(ctx: IdentityContext, moduleId: ModuleId): boolean {
  // Founder home module is FOUNDER-only; other roles use AcademyOS module launchers.
  if (moduleId === "executive") return canViewFounderDashboard(ctx);

  const permissions =
    QUICK_LAUNCH_PERMISSIONS[moduleId as keyof typeof QUICK_LAUNCH_PERMISSIONS];
  if (!permissions) return false;
  return hasAnyPermission(ctx, permissions);
}

export function getVisibleQuickLaunchModuleIds(ctx: IdentityContext): ModuleId[] {
  return FOUNDERS_QUICK_LAUNCH_MODULE_IDS.filter((id) => canViewQuickLaunchModule(ctx, id));
}

export function canViewMissionControlLink(ctx: IdentityContext): boolean {
  return canViewFounderDashboard(ctx) && hasPermission(ctx, "mission_control.access");
}

export function canViewExecutiveIntelligenceLink(ctx: IdentityContext): boolean {
  return canViewFounderDashboard(ctx) && canAccessExecutiveIntelligence(ctx);
}
