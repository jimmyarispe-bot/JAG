import type { ProfileKindDefinition } from "@/lib/platform/profile/types";
import { buildEmployeeProfileEnvelope } from "@/lib/employees/profile/envelope";

/** Legacy HR employee detail keys → canonical ?section= keys. */
export const EMPLOYEE_PROFILE_LEGACY_REDIRECTS: Record<string, string> = {
  profile: "employment-information",
  employment: "employment-information",
  position: "position",
  payroll: "payroll",
  pto: "pto",
  certifications: "certifications",
  documents: "documents",
  timeline: "activity",
  notes: "notes",
};

export const EMPLOYEE_PROFILE_KIND: ProfileKindDefinition = {
  kind: "employee",
  entityType: "employee",
  label: "Employee Profile",
  subtitle: "Employee Profile",
  basePath: "/dashboard/hr/employees",
  sectionParam: "section",
  defaultSection: "overview",
  viewPermissions: ["hr.view", "employee.self_service"],
  buildEnvelope: buildEmployeeProfileEnvelope,
  legacySectionRedirects: EMPLOYEE_PROFILE_LEGACY_REDIRECTS,
};
