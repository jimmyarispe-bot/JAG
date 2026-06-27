import type { ProfileKindDefinition } from "@/lib/platform/profile/types";
import { buildAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/envelope";

/** Legacy lead detail keys → canonical ?section= keys. */
export const ADMISSIONS_CASE_LEGACY_REDIRECTS: Record<string, string> = {
  profile: "overview",
  lead: "prospect",
  checklist: "applications",
  decision: "decisions",
  enrollment: "enrollment",
  communications: "communications",
  timeline: "activity",
  notes: "notes",
  tasks: "tasks",
};

export const ADMISSIONS_CASE_PROFILE_KIND: ProfileKindDefinition = {
  kind: "admissions_case",
  entityType: "admissions_lead",
  label: "Admissions Case",
  subtitle: "Admissions Case",
  basePath: "/dashboard/admissions/cases",
  sectionParam: "section",
  defaultSection: "overview",
  viewPermissions: ["admissions.view", "admissions.manage", "admissions.accept"],
  buildEnvelope: buildAdmissionsCaseProfileEnvelope,
  legacySectionRedirects: ADMISSIONS_CASE_LEGACY_REDIRECTS,
};
