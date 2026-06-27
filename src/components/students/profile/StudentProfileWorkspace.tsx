import { ProfileSectionRenderer } from "@/components/platform/profile-workspace/ProfileSectionRenderer";
import { ProfileNotesPanel } from "@/components/platform/profile-sections/ProfileNotesPanel";
import { ProfileTagsList } from "@/components/platform/profile-sections/ProfileTagsList";
import { ProfileWorkspaceSectionNav } from "@/components/platform/profile-workspace/ProfileWorkspaceSectionNav";
import { ProfileWorkspaceShell } from "@/components/platform/profile-workspace/ProfileWorkspaceShell";
import {
  StudentProfileAvatar,
  StudentProfileBadges,
  StudentProfileHeaderActions,
  StudentProfileHeaderAlerts,
} from "@/components/students/profile/StudentProfileHeaderExtras";
import { StudentSuccessQuickActions } from "@/components/students/StudentSuccessQuickActions";
import type { ProfileSectionContributions } from "@/lib/platform/profile/sections/types";
import type { ProfileNavigationModel } from "@/lib/platform/profile/types";
import type { PlatformNote } from "@/lib/platform/notes/types";
import type { PlatformEntityTag } from "@/lib/platform/tags/types";
import type { StudentRecord } from "@/lib/students/queries";
import type { StudentProfileEnvelope } from "@/lib/students/profile/types";
import type { ExecutiveSummary } from "@/lib/ssis/queries";

interface StudentProfileWorkspaceProps {
  envelope: StudentProfileEnvelope;
  navigation: ProfileNavigationModel;
  student: StudentRecord;
  summary: ExecutiveSummary;
  activeSection: string;
  activeSectionData: unknown;
  pinnedNotes: PlatformNote[];
  entityTags: PlatformEntityTag[];
  sectionContributions?: ProfileSectionContributions | null;
}

export function StudentProfileWorkspace({
  envelope,
  navigation,
  student,
  summary,
  activeSection,
  activeSectionData,
  pinnedNotes,
  entityTags,
  sectionContributions,
}: StudentProfileWorkspaceProps) {
  const activeSectionDef =
    navigation.activeSectionDef ??
    navigation.pinned.find((s) => s.key === navigation.activeSection) ??
    navigation.groups.flatMap((g) => g.sections).find((s) => s.key === navigation.activeSection);

  if (!activeSectionDef) {
    return null;
  }

  return (
    <ProfileWorkspaceShell
      header={{
        backHref: "/dashboard/students",
        backLabel: "Students",
        title: envelope.displayName,
        subtitle: envelope.subtitle,
        avatar: <StudentProfileAvatar student={student} />,
        badges: (
          <>
            <StudentProfileBadges student={student} summary={summary} />
            {entityTags.length > 0 && (
              <div className="mt-2 w-full">
                <ProfileTagsList tags={entityTags} title="" />
              </div>
            )}
          </>
        ),
        actions: (
          <StudentProfileHeaderActions
            studentId={student.id}
            admissionsLeadId={student.admissions_lead_id}
          />
        ),
        alerts: sectionContributions?.header?.alerts ?? (
          <StudentProfileHeaderAlerts summary={summary} />
        ),
      }}
      sectionNav={<ProfileWorkspaceSectionNav navigation={navigation} />}
      context={{
        quickActions: sectionContributions?.context?.quickActions ?? (
          <StudentSuccessQuickActions
            studentId={student.id}
            lifecycleStage={summary.lifecycleStage}
          />
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
          summary.outstandingTasks > 0 ? (
            <p className="text-sm text-slate-700">
              {summary.outstandingTasks} open Mission Control task(s) for this student.
            </p>
          ) : (
            <p className="text-sm text-slate-500">No new notifications.</p>
          )
        ),
        tasks: sectionContributions?.context?.tasks,
        approvals: sectionContributions?.context?.approvals,
      }}
      contextTitle="Student Context"
      workspace={
        <ProfileSectionRenderer
          profileKind="student"
          sectionKey={activeSection}
          envelope={envelope}
          data={activeSectionData}
        />
      }
    />
  );
}
