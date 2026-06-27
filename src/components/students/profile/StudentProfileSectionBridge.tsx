import { ProfileSectionPlaceholder } from "@/components/platform/profile-workspace/ProfileSectionPlaceholder";
import { StudentDetailContent } from "@/components/students/StudentDetailContent";
import type { ResolvedProfileSection } from "@/lib/platform/profile/types";
import type { StudentDetailContentProps } from "@/components/students/StudentDetailContent";

/** Maps canonical profile section keys → legacy SSIS tab values for Phase 3 bridge. */
export const STUDENT_SECTION_TO_LEGACY_TAB: Record<string, string> = {
  overview: "overview",
  identity: "profile",
  enrollment: "profile",
  academics: "academic",
  progress: "academic",
  attendance: "attendance",
  behavior: "behavior",
  "special-ed": "special-ed",
  therapy: "services",
  medical: "medical",
  family: "family",
  scholarships: "funding",
  documents: "documents",
  communications: "engagement",
  timeline: "communication",
};

const PLACEHOLDER_COPY: Partial<Record<string, string>> = {
  admissions: "Admissions conversion and application history — full panel in Phase 4.",
  "map-nwea": "Connect NWEA MAP in Integration Hub to sync assessment results.",
  scheduling: "Upcoming sessions from the Scheduling module will appear here.",
  billing: "Family billing summary from the Finance module will appear here.",
  transportation: "Enable the Transportation module in Configuration Studio.",
  compliance: "Student-scoped compliance obligations from the Compliance Center.",
  "ai-insights": "Intelligence Network recommendations will surface here.",
  audit: "Audit history from the Global Activity Engine.",
};

interface StudentProfileSectionBridgeProps extends Omit<StudentDetailContentProps, "tab"> {
  activeSection: ResolvedProfileSection;
}

export function StudentProfileSectionBridge({
  activeSection,
  ...legacyProps
}: StudentProfileSectionBridgeProps) {
  const legacyTab = STUDENT_SECTION_TO_LEGACY_TAB[activeSection.key];

  if (!legacyTab) {
    return (
      <ProfileSectionPlaceholder
        title={activeSection.label}
        status={activeSection.status}
        description={PLACEHOLDER_COPY[activeSection.key]}
      />
    );
  }

  return (
    <StudentDetailContent
      {...legacyProps}
      tab={legacyTab}
      hideTabs
      suppressOverviewQuickActions={activeSection.key === "overview"}
    />
  );
}
