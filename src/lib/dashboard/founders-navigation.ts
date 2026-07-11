import type { OrganizationBranding } from "@/lib/branding/types";

/** Founder's Edition platform footer links — routes preserved; labels resolved from branding. */
export const FOUNDERS_PLATFORM_NAV = [
  { href: "/dashboard/mission-control", labelKey: "missionControlLabel" as const },
  { href: "/dashboard/executive", labelKey: "intelligenceEngineLabel" as const },
  { href: "/dashboard/compliance", labelKey: "complianceLabel" as const },
  { href: "/dashboard/finance/intelligence", labelKey: "financialIntelligenceLabel" as const },
  { href: "/dashboard/integrations", labelKey: "connectLabel" as const },
  { href: "/dashboard/data", labelKey: "dataHubLabel" as const },
  { href: "/dashboard/admin", labelKey: "administration" as const },
  { href: "/dashboard/search", labelKey: "globalSearch" as const },
] as const;

export const FOUNDERS_UTILITY_NAV = [
  { href: "/dashboard/settings/preferences", label: "My Preferences" },
  { href: "/dashboard/employee", label: "Employee Portal" },
] as const;

export function resolvePlatformNavLabel(
  labelKey: (typeof FOUNDERS_PLATFORM_NAV)[number]["labelKey"],
  branding: OrganizationBranding
): string {
  if (labelKey === "administration") return "Administration";
  if (labelKey === "globalSearch") return "Global Search";
  return branding[labelKey];
}

/** P0 quick-launch modules for Founder's Edition (excludes scholarships and duplicate home). */
export const FOUNDERS_QUICK_LAUNCH_MODULE_IDS = [
  "admissions",
  "students",
  "scheduling",
  "teacher",
  "finance",
  "hr",
] as const;

/** Trimmed executive sub-routes for Founder's Edition. */
export const FOUNDERS_EXECUTIVE_NAV = [
  { href: "/dashboard/executive", label: "Command Center", exact: true },
  { href: "/dashboard/jag", label: "JAG Workspace" },
  { href: "/dashboard/executive/decisions", label: "Decisions" },
  { href: "/dashboard/executive/briefings", label: "Briefings" },
  { href: "/dashboard/executive/kpis", label: "KPIs" },
  { href: "/dashboard/executive/forecasting", label: "Forecasting" },
  { href: "/dashboard/executive/risk", label: "Risk" },
  { href: "/dashboard/executive/board", label: "Board Reports" },
  { href: "/dashboard/executive/compliance", label: "Compliance" },
] as const;

export function getFoundersModuleLabels(branding: OrganizationBranding) {
  return {
    executive: branding.founderWorkspaceLabel,
    admissions: "Admissions",
    students: "Student Success",
    scheduling: "Scheduling",
    teacher: "Teacher Studio",
    scholarships: "Scholarships",
    finance: "Finance",
    hr: "Workforce",
  };
}
