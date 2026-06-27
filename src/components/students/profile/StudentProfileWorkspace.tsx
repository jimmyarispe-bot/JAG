import { PlatformProfileWorkspace } from "@/components/platform/profile-workspace/PlatformProfileWorkspace";
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
  return (
    <PlatformProfileWorkspace
      config={{
        profileKind: "student",
        envelope,
        navigation,
        activeSection,
        activeSectionData,
        pinnedNotes,
        entityTags,
        sectionContributions,
        contextTitle: "Student Context",
        header: {
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
        },
        contextDefaults: {
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
          notifications:
            summary.outstandingTasks > 0 ? (
              <p className="text-sm text-slate-700">
                {summary.outstandingTasks} open Mission Control task(s) for this student.
              </p>
            ) : (
              <p className="text-sm text-slate-500">No new notifications.</p>
            ),
        },
      }}
    />
  );
}
