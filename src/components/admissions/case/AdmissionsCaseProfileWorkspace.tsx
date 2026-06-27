import { PlatformProfileWorkspace } from "@/components/platform/profile-workspace/PlatformProfileWorkspace";
import {
  AdmissionsCaseProfileBadges,
  AdmissionsCaseProfileHeaderActions,
} from "@/components/admissions/case/AdmissionsCaseHeaderExtras";
import type { ProfileSectionContributions } from "@/lib/platform/profile/sections/types";
import type { ProfileNavigationModel } from "@/lib/platform/profile/types";
import type { PlatformNote } from "@/lib/platform/notes/types";
import type { PlatformEntityTag } from "@/lib/platform/tags/types";
import type { AdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";

interface AdmissionsCaseProfileWorkspaceProps {
  envelope: AdmissionsCaseProfileEnvelope;
  navigation: ProfileNavigationModel;
  activeSection: string;
  activeSectionData: unknown;
  pinnedNotes: PlatformNote[];
  entityTags: PlatformEntityTag[];
  sectionContributions?: ProfileSectionContributions | null;
}

export function AdmissionsCaseProfileWorkspace({
  envelope,
  navigation,
  activeSection,
  activeSectionData,
  pinnedNotes,
  entityTags,
  sectionContributions,
}: AdmissionsCaseProfileWorkspaceProps) {
  return (
    <PlatformProfileWorkspace
      config={{
        profileKind: "admissions_case",
        envelope,
        navigation,
        activeSection,
        activeSectionData,
        pinnedNotes,
        entityTags,
        sectionContributions,
        contextTitle: "Case Context",
        header: {
          backHref: "/dashboard/admissions",
          backLabel: "Admissions",
          title: envelope.displayName,
          subtitle: envelope.pipelineStageLabel,
          badges: <AdmissionsCaseProfileBadges envelope={envelope} />,
          actions: sectionContributions?.header?.actions ?? (
            <AdmissionsCaseProfileHeaderActions envelope={envelope} />
          ),
        },
        contextDefaults: {
          quickActions: (
            <p className="text-sm text-slate-500">
              Case workflow actions appear in the Pipeline section.
            </p>
          ),
          aiRecommendations: (
            <p className="text-sm text-slate-500">
              Admissions intelligence recommendations will appear here when available.
            </p>
          ),
          notifications: <p className="text-sm text-slate-500">No new case notifications.</p>,
        },
      }}
    />
  );
}
