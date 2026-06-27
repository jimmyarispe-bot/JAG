import type { ProfileKindDefinition } from "@/lib/platform/profile/types";
import { buildStudentProfileEnvelope } from "@/lib/students/profile/envelope";

/** Legacy ?tab= keys from SSIS-era student detail → canonical ?section= keys. */
export const STUDENT_PROFILE_LEGACY_REDIRECTS: Record<string, string> = {
  tab: "overview",
  profile: "identity",
  family: "family",
  medical: "medical",
  "special-ed": "special-ed",
  academic: "academics",
  attendance: "attendance",
  behavior: "behavior",
  services: "therapy",
  funding: "scholarships",
  documents: "documents",
  communication: "timeline",
  engagement: "communications",
};

export const STUDENT_PROFILE_KIND: ProfileKindDefinition = {
  kind: "student",
  entityType: "student",
  label: "Student Profile",
  subtitle: "Student Profile",
  basePath: "/dashboard/students",
  sectionParam: "section",
  defaultSection: "overview",
  viewPermissions: ["students.view"],
  buildEnvelope: buildStudentProfileEnvelope,
  legacySectionRedirects: STUDENT_PROFILE_LEGACY_REDIRECTS,
};
