/**
 * Major production workflow inventory — Sprint 210.
 * Catalog only; no new product features.
 */

import type { ValidationDimension, WorkflowInventoryItem } from "./types";

const ALL_DIMENSIONS: readonly ValidationDimension[] = [
  "happy_path",
  "permission_failure",
  "missing_data",
  "deep_links",
  "empty_states",
  "a11y",
  "mobile",
] as const;

function item(
  partial: Omit<WorkflowInventoryItem, "validationDimensions"> & {
    readonly validationDimensions?: readonly ValidationDimension[];
  }
): WorkflowInventoryItem {
  return {
    ...partial,
    validationDimensions: partial.validationDimensions ?? ALL_DIMENSIONS,
  };
}

/**
 * Every major workflow from the Sprint 210 certification list.
 */
export const WORKFLOW_INVENTORY: readonly WorkflowInventoryItem[] = [
  item({
    id: "authentication",
    name: "Authentication",
    domain: "platform",
    primaryRoutes: [
      "/login",
      "/login/activate",
      "/login/forgot",
      "/login/reset-required",
      "/login/mfa-required",
      "/auth/callback",
      "/jag/login",
    ],
    keyModules: [
      "src/lib/auth",
      "src/lib/platform/identity",
      "src/lib/jag-platform/auth.ts",
      "middleware.ts",
    ],
  }),
  item({
    id: "authorization",
    name: "Authorization",
    domain: "platform",
    primaryRoutes: ["/dashboard", "/portal", "/founder", "/exec", "/jag"],
    keyModules: [
      "src/lib/platform/identity/page-guard.ts",
      "src/lib/platform/identity/api-guard.ts",
      "src/lib/platform/identity/action-guards.ts",
      "src/lib/platform/identity/route-authorization.ts",
    ],
  }),
  item({
    id: "admissions",
    name: "Admissions",
    domain: "academyos",
    primaryRoutes: ["/dashboard/admissions", "/apply", "/apply/portal"],
    keyModules: ["src/lib/admissions", "src/app/dashboard/admissions"],
  }),
  item({
    id: "students-sis",
    name: "Students (SIS)",
    domain: "academyos",
    primaryRoutes: ["/dashboard/students"],
    keyModules: ["src/lib/students", "src/app/dashboard/students"],
  }),
  item({
    id: "families",
    name: "Families",
    domain: "academyos",
    primaryRoutes: ["/portal", "/dashboard/admin/families"],
    keyModules: ["src/lib/families", "src/app/portal"],
  }),
  item({
    id: "employees",
    name: "Employees",
    domain: "academyos",
    primaryRoutes: ["/dashboard/employee", "/dashboard/hr"],
    keyModules: ["packages/academyos/workforce", "src/app/dashboard/employee"],
  }),
  item({
    id: "hr",
    name: "HR",
    domain: "academyos",
    primaryRoutes: ["/dashboard/hr"],
    keyModules: ["src/lib/hr", "src/app/dashboard/hr"],
  }),
  item({
    id: "scheduling",
    name: "Scheduling",
    domain: "academyos",
    primaryRoutes: ["/dashboard/scheduling"],
    keyModules: ["src/lib/scheduling", "src/app/dashboard/scheduling"],
  }),
  item({
    id: "attendance",
    name: "Attendance",
    domain: "academyos",
    primaryRoutes: ["/dashboard/students", "/portal/calendar", "/portal/progress"],
    keyModules: ["src/lib/sis", "src/app/portal"],
  }),
  item({
    id: "communications",
    name: "Communications",
    domain: "academyos",
    primaryRoutes: ["/portal/messages"],
    keyModules: ["src/lib/communications", "src/app/portal"],
  }),
  item({
    id: "documents",
    name: "Documents",
    domain: "academyos",
    primaryRoutes: ["/portal/documents"],
    keyModules: ["src/lib/documents", "src/app/portal"],
  }),
  item({
    id: "finance",
    name: "Finance",
    domain: "academyos",
    primaryRoutes: [
      "/dashboard/finance",
      "/dashboard/finance/intelligence",
      "/portal/finance",
    ],
    keyModules: ["src/lib/finance", "src/app/dashboard/finance"],
  }),
  item({
    id: "scholarships",
    name: "Scholarships",
    domain: "academyos",
    primaryRoutes: ["/dashboard/scholarships"],
    keyModules: ["src/lib/scholarships", "src/app/dashboard/scholarships"],
  }),
  item({
    id: "calendar",
    name: "Calendar",
    domain: "academyos",
    primaryRoutes: ["/portal/calendar"],
    keyModules: ["src/lib/calendar", "src/app/portal"],
  }),
  item({
    id: "executive-dashboards",
    name: "Executive dashboards",
    domain: "jag",
    primaryRoutes: ["/exec", "/dashboard/executive", "/jag/executive", "/jag"],
    keyModules: [
      "src/lib/jag-command-center",
      "src/app/exec",
      "src/app/jag",
    ],
  }),
  item({
    id: "observability",
    name: "Observability",
    domain: "jag",
    primaryRoutes: ["/jag/observability", "/jag/health"],
    keyModules: [
      "src/lib/observability",
      "src/app/jag/(portal)/observability",
    ],
  }),
  item({
    id: "production-readiness",
    name: "Production Readiness",
    domain: "jag",
    primaryRoutes: ["/jag/readiness"],
    keyModules: ["src/lib/jag-command-center/production-readiness"],
  }),
  item({
    id: "explainability",
    name: "Explainability",
    domain: "jag",
    primaryRoutes: ["/jag/graph", "/jag/intelligence-graph"],
    keyModules: [
      "src/lib/jag-command-center/explain",
      "src/lib/platform/intelligence/explain",
    ],
  }),
  item({
    id: "memory",
    name: "Memory",
    domain: "jag",
    primaryRoutes: ["/jag/memory"],
    keyModules: ["src/lib/jag-command-center/memory"],
  }),
  item({
    id: "strategy",
    name: "Strategy",
    domain: "jag",
    primaryRoutes: ["/jag/strategy"],
    keyModules: ["src/lib/jag-command-center/strategy"],
  }),
  item({
    id: "watchers",
    name: "Watchers",
    domain: "jag",
    primaryRoutes: ["/jag/inbox"],
    keyModules: [
      "src/lib/jag-command-center/watchers",
      "src/lib/platform/intelligence/watchers",
    ],
  }),
  item({
    id: "graph",
    name: "Graph",
    domain: "jag",
    primaryRoutes: ["/jag/graph", "/jag/intelligence-graph"],
    keyModules: ["src/lib/jag-command-center/explain"],
  }),
  item({
    id: "release-management",
    name: "Release Management",
    domain: "platform",
    primaryRoutes: ["/dashboard/executive/release", "/jag/readiness"],
    keyModules: [
      "src/lib/platform/release",
      "src/lib/jag-command-center/ga-certification",
    ],
  }),
] as const;

export function listWorkflowInventory(): readonly WorkflowInventoryItem[] {
  return WORKFLOW_INVENTORY;
}
