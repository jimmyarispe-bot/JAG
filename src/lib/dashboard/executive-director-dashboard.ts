/**
 * Executive Director dashboard — AcademyOS operating home.
 * Gated by permissions only (never role-name checks).
 * Never includes Founder / JAG-only surfaces.
 */

import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";

export function canViewExecutiveDirectorDashboard(ctx: IdentityContext): boolean {
  // Founder / JAG home takes precedence — Founder Edition is never the ED workspace.
  if (hasPermission(ctx, "JAG_ACCESS")) return false;
  // ED operating home requires the Executive Director role (not every ACADEMYOS_ACCESS user).
  if (!ctx.roles.includes("EXECUTIVE_DIRECTOR")) return false;
  return (
    hasPermission(ctx, "ACADEMYOS_ACCESS") &&
    hasPermission(ctx, "executive.dashboard")
  );
}

export const EXECUTIVE_DIRECTOR_DASHBOARD_NAV = [
  {
    id: "enrollment",
    label: "Enrollment",
    description: "Active enrollment and student headcount",
    href: "/dashboard/students",
  },
  {
    id: "operations",
    label: "Operations",
    description: "Day-to-day school operations and priorities",
    href: "/dashboard/mission-control",
  },
  {
    id: "admissions",
    label: "Admissions",
    description: "Pipeline, tours, and enrollment decisions",
    href: "/dashboard/admissions",
  },
  {
    id: "compliance",
    label: "Compliance",
    description: "Obligations, audits, and risk posture",
    href: "/dashboard/compliance",
  },
  {
    id: "student_success",
    label: "Student Success",
    description: "SIS, attendance, and student outcomes",
    href: "/dashboard/students",
  },
  {
    id: "staffing",
    label: "Staffing",
    description: "Workforce, credentials, and coverage",
    href: "/dashboard/hr",
  },
  {
    id: "executive_kpis",
    label: "Executive KPIs",
    description: "Leadership KPI scorecards",
    href: "/dashboard/executive/kpis",
  },
  {
    id: "financial_kpis",
    label: "Financial KPIs",
    description: "Revenue, collections, and financial intelligence",
    href: "/dashboard/finance/intelligence",
  },
] as const;

export type ExecutiveDirectorNavId = (typeof EXECUTIVE_DIRECTOR_DASHBOARD_NAV)[number]["id"];
