import { ProfileWorkspaceSectionNav } from "@/components/platform/profile-workspace/ProfileWorkspaceSectionNav";
import { ProfileWorkspaceShell } from "@/components/platform/profile-workspace/ProfileWorkspaceShell";
import {
  StudentProfileAvatar,
  StudentProfileBadges,
  StudentProfileHeaderActions,
  StudentProfileHeaderAlerts,
} from "@/components/students/profile/StudentProfileHeaderExtras";
import { StudentProfileSectionBridge } from "@/components/students/profile/StudentProfileSectionBridge";
import { StudentSuccessQuickActions } from "@/components/students/StudentSuccessQuickActions";
import type { ProfileNavigationModel } from "@/lib/platform/profile/types";
import type { StudentProfileEnvelope } from "@/lib/students/profile/types";
import type { StudentDetailContentProps } from "@/components/students/StudentDetailContent";

type LegacyDetailProps = Omit<StudentDetailContentProps, "tab" | "hideTabs" | "suppressOverviewQuickActions">;

interface StudentProfileWorkspaceProps extends LegacyDetailProps {
  envelope: StudentProfileEnvelope;
  navigation: ProfileNavigationModel;
}

export function StudentProfileWorkspace({
  envelope,
  navigation,
  student,
  summary,
  ...legacyProps
}: StudentProfileWorkspaceProps) {
  const activeSection =
    navigation.activeSectionDef ??
    navigation.pinned.find((s) => s.key === navigation.activeSection) ??
    navigation.groups.flatMap((g) => g.sections).find((s) => s.key === navigation.activeSection);

  if (!activeSection) {
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
        badges: <StudentProfileBadges student={student} summary={summary} />,
        actions: (
          <StudentProfileHeaderActions
            studentId={student.id}
            admissionsLeadId={student.admissions_lead_id}
          />
        ),
        alerts: <StudentProfileHeaderAlerts summary={summary} />,
      }}
      sectionNav={<ProfileWorkspaceSectionNav navigation={navigation} />}
      context={{
        quickActions: (
          <StudentSuccessQuickActions
            studentId={student.id}
            lifecycleStage={summary.lifecycleStage}
          />
        ),
        aiRecommendations: (
          <p className="text-sm text-slate-500">
            AI recommendations from the Intelligence Network will appear here when available.
          </p>
        ),
        notifications: summary.outstandingTasks > 0 ? (
          <p className="text-sm text-slate-700">
            {summary.outstandingTasks} open Mission Control task(s) for this student.
          </p>
        ) : (
          <p className="text-sm text-slate-500">No new notifications.</p>
        ),
      }}
      contextTitle="Student Context"
      workspace={
        <StudentProfileSectionBridge
          activeSection={activeSection}
          student={student}
          summary={summary}
          {...legacyProps}
        />
      }
    />
  );
}
