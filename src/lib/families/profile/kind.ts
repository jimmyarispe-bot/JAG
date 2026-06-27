import type { ProfileKindDefinition } from "@/lib/platform/profile/types";
import { buildFamilyProfileEnvelope } from "@/lib/families/profile/envelope";

/** Legacy family detail keys → canonical ?section= keys. */
export const FAMILY_PROFILE_LEGACY_REDIRECTS: Record<string, string> = {
  profile: "overview",
  billing: "tuition",
  finance: "tuition",
  guardians: "parents-guardians",
  parents: "parents-guardians",
  timeline: "activity",
  notes: "notes",
};

export const FAMILY_PROFILE_KIND: ProfileKindDefinition = {
  kind: "family",
  entityType: "family",
  label: "Household Profile",
  subtitle: "Household",
  basePath: "/dashboard/families",
  sectionParam: "section",
  defaultSection: "overview",
  viewPermissions: ["students.view", "portal.parent.access"],
  buildEnvelope: buildFamilyProfileEnvelope,
  legacySectionRedirects: FAMILY_PROFILE_LEGACY_REDIRECTS,
};
