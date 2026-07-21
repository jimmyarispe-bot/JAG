import { PlatformProfileWorkspace } from "@/components/platform/profile-workspace/PlatformProfileWorkspace";
import {
  FamilyProfileAvatar,
  FamilyProfileBadges,
  FamilyProfileHeaderActions,
} from "@/components/families/profile/FamilyProfileHeaderExtras";
import { FamilyOpsPanel } from "@/components/families/FamilyOpsPanel";
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
  canManageLifecycle?: boolean;
  opsStudents?: Array<{ id: string; first_name: string; last_name: string }>;
  otherFamilies?: Array<{ id: string; family_name: string }>;
}

export function FamilyProfileWorkspace({
  envelope,
  navigation,
  activeSection,
  activeSectionData,
  pinnedNotes,
  entityTags,
  sectionContributions,
  canManageLifecycle = false,
  opsStudents = [],
  otherFamilies = [],
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
          backHref: "/dashboard/families",
          backLabel: "Families",
          title: envelope.displayName,
          subtitle: envelope.subtitle,
          avatar: <FamilyProfileAvatar envelope={envelope} />,
          badges: <FamilyProfileBadges envelope={envelope} />,
          actions: sectionContributions?.header?.actions ?? (
            <FamilyProfileHeaderActions
              envelope={envelope}
              canManageLifecycle={canManageLifecycle}
            />
          ),
        },
        contextDefaults: {
          quickActions: canManageLifecycle ? (
            <FamilyOpsPanel
              familyId={envelope.familyId}
              familyName={envelope.displayName}
              students={opsStudents}
              otherFamilies={otherFamilies}
              canManage={canManageLifecycle}
            />
          ) : (
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
