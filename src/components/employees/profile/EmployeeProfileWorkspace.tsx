import { ProfileSectionRenderer } from "@/components/platform/profile-workspace/ProfileSectionRenderer";
import { ProfileNotesPanel } from "@/components/platform/profile-sections/ProfileNotesPanel";
import { ProfileTagsList } from "@/components/platform/profile-sections/ProfileTagsList";
import { ProfileWorkspaceSectionNav } from "@/components/platform/profile-workspace/ProfileWorkspaceSectionNav";
import { ProfileWorkspaceShell } from "@/components/platform/profile-workspace/ProfileWorkspaceShell";
import {
  EmployeeProfileAvatar,
  EmployeeProfileBadges,
  EmployeeProfileHeaderActions,
} from "@/components/employees/profile/EmployeeProfileHeaderExtras";
import { findActiveSectionDef } from "@/lib/platform/profile/navigation";
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
  const activeSectionDef = findActiveSectionDef(navigation);

  if (!activeSectionDef) {
    return null;
  }

  return (
    <ProfileWorkspaceShell
      header={{
        backHref: "/dashboard/hr",
        backLabel: "HR",
        title: envelope.displayName,
        subtitle: envelope.subtitle,
        avatar: <EmployeeProfileAvatar envelope={envelope} />,
        badges: (
          <>
            <EmployeeProfileBadges envelope={envelope} />
            {entityTags.length > 0 && (
              <div className="mt-2 w-full">
                <ProfileTagsList tags={entityTags} title="" />
              </div>
            )}
          </>
        ),
        actions: sectionContributions?.header?.actions ?? (
          <EmployeeProfileHeaderActions envelope={envelope} />
        ),
        alerts: sectionContributions?.header?.alerts,
      }}
      sectionNav={<ProfileWorkspaceSectionNav navigation={navigation} />}
      context={{
        quickActions: sectionContributions?.context?.quickActions ?? (
          <p className="text-sm text-slate-500">
            HR quick actions will appear here when configured.
          </p>
        ),
        widgets: (
          <>
            {sectionContributions?.context?.widgets}
            {pinnedNotes.length > 0 && (
              <ProfileNotesPanel notes={pinnedNotes} title="Pinned Notes" limit={5} />
            )}
          </>
        ),
        aiRecommendations: sectionContributions?.context?.aiRecommendations ?? (
          <p className="text-sm text-slate-500">
            AI recommendations from the Intelligence Network will appear here when available.
          </p>
        ),
        notifications: sectionContributions?.context?.notifications ?? (
          <p className="text-sm text-slate-500">No new notifications.</p>
        ),
        tasks: sectionContributions?.context?.tasks,
        approvals: sectionContributions?.context?.approvals,
      }}
      contextTitle="Employee Context"
      workspace={
        <ProfileSectionRenderer
          profileKind="employee"
          sectionKey={activeSection}
          envelope={envelope}
          data={activeSectionData}
        />
      }
    />
  );
}
