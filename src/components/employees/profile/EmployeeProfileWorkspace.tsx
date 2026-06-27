import { PlatformProfileWorkspace } from "@/components/platform/profile-workspace/PlatformProfileWorkspace";
import {
  EmployeeProfileAvatar,
  EmployeeProfileBadges,
  EmployeeProfileHeaderActions,
} from "@/components/employees/profile/EmployeeProfileHeaderExtras";
import type { ProfileSectionContributions } from "@/lib/platform/profile/sections/types";
import type { ProfileNavigationModel } from "@/lib/platform/profile/types";
import type { PlatformNote } from "@/lib/platform/notes/types";
import type { PlatformEntityTag } from "@/lib/platform/tags/types";
import type { EmployeeProfileEnvelope } from "@/lib/employees/profile/types";

interface EmployeeProfileWorkspaceProps {
  envelope: EmployeeProfileEnvelope;
  navigation: ProfileNavigationModel;
  activeSection: string;
  activeSectionData: unknown;
  pinnedNotes: PlatformNote[];
  entityTags: PlatformEntityTag[];
  sectionContributions?: ProfileSectionContributions | null;
}

export function EmployeeProfileWorkspace({
  envelope,
  navigation,
  activeSection,
  activeSectionData,
  pinnedNotes,
  entityTags,
  sectionContributions,
}: EmployeeProfileWorkspaceProps) {
  return (
    <PlatformProfileWorkspace
      config={{
        profileKind: "employee",
        envelope,
        navigation,
        activeSection,
        activeSectionData,
        pinnedNotes,
        entityTags,
        sectionContributions,
        contextTitle: "Employee Context",
        header: {
          backHref: "/dashboard/hr",
          backLabel: "HR",
          title: envelope.displayName,
          subtitle: envelope.subtitle,
          avatar: <EmployeeProfileAvatar envelope={envelope} />,
          badges: <EmployeeProfileBadges envelope={envelope} />,
          actions: sectionContributions?.header?.actions ?? (
            <EmployeeProfileHeaderActions envelope={envelope} />
          ),
        },
        contextDefaults: {
          quickActions: (
            <p className="text-sm text-slate-500">
              HR quick actions will appear here when configured.
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
