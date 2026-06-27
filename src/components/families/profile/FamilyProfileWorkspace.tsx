import { PlatformProfileWorkspace } from "@/components/platform/profile-workspace/PlatformProfileWorkspace";
import {
  FamilyProfileAvatar,
  FamilyProfileBadges,
  FamilyProfileHeaderActions,
} from "@/components/families/profile/FamilyProfileHeaderExtras";
import type { ProfileSectionContributions } from "@/lib/platform/profile/sections/types";
import type { ProfileNavigationModel } from "@/lib/platform/profile/types";
import type { PlatformNote } from "@/lib/platform/notes/types";
import type { PlatformEntityTag } from "@/lib/platform/tags/types";
import type { FamilyProfileEnvelope } from "@/lib/families/profile/types";

interface FamilyProfileWorkspaceProps {
  envelope: FamilyProfileEnvelope;
  navigation: ProfileNavigationModel;
  activeSection: string;
  activeSectionData: unknown;
  pinnedNotes: PlatformNote[];
  entityTags: PlatformEntityTag[];
  sectionContributions?: ProfileSectionContributions | null;
}

export function FamilyProfileWorkspace({
  envelope,
  navigation,
  activeSection,
  activeSectionData,
  pinnedNotes,
  entityTags,
  sectionContributions,
}: FamilyProfileWorkspaceProps) {
  return (
    <PlatformProfileWorkspace
      config={{
        profileKind: "family",
        envelope,
        navigation,
        activeSection,
        activeSectionData,
        pinnedNotes,
        entityTags,
        sectionContributions,
        contextTitle: "Household Context",
        header: {
          backHref: "/dashboard/students?view=families",
          backLabel: "Families",
          title: envelope.displayName,
          subtitle: envelope.subtitle,
          avatar: <FamilyProfileAvatar envelope={envelope} />,
          badges: <FamilyProfileBadges envelope={envelope} />,
          actions: sectionContributions?.header?.actions ?? (
            <FamilyProfileHeaderActions envelope={envelope} />
          ),
        },
        contextDefaults: {
          quickActions: (
            <p className="text-sm text-slate-500">
              Household quick actions will appear here when configured.
            </p>
          ),
          aiRecommendations: (
            <p className="text-sm text-slate-500">
              AI recommendations from the Intelligence Network will appear here when available.
            </p>
          ),
          notifications: <p className="text-sm text-slate-500">No new notifications.</p>,
        },
      }}
    />
  );
}
