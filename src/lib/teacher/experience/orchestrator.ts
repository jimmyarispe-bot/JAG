import {
  completeSessionAction,
  startLessonAction,
  takeSessionAttendanceAction,
} from "@/lib/teacher/actions";
import { updatePortalPreferencesAction } from "@/lib/portal/actions";
import {
  TEACHER_EXPERIENCE_ENGINES,
  TEACHER_EXPERIENCE_GUARDS,
  TEACHER_EXPERIENCE_NAV,
  TEACHER_QUICK_ACTIONS,
} from "./constants";
import { publishTeacherExperienceEvent } from "./events";
import { searchParentDocumentsInKnowledge } from "@/lib/portal/experience/knowledge-bridge";

export function createTeacherExperienceOrchestrator() {
  return {
    guards: TEACHER_EXPERIENCE_GUARDS,
    engines: TEACHER_EXPERIENCE_ENGINES,
    nav: TEACHER_EXPERIENCE_NAV,
    quickActions: TEACHER_QUICK_ACTIONS,

    publishDashboardViewed(input: {
      organizationId: string;
      actorUserId: string;
      employeeId: string;
    }) {
      return publishTeacherExperienceEvent({
        type: "teacher.dashboard_viewed",
        organizationId: input.organizationId,
        recordType: "employee",
        recordId: input.employeeId,
        actorUserId: input.actorUserId,
      });
    },

    async takeAttendance(formData: FormData, organizationId?: string | null) {
      const result = await takeSessionAttendanceAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishTeacherExperienceEvent({
          type: "teacher.attendance_taken",
          organizationId,
          recordType: "instructional_session",
          recordId: String(formData.get("session_id") ?? "session"),
          payload: { attendance: "existing_bridge" },
        });
      }
      return result;
    },

    async startLesson(formData: FormData, organizationId?: string | null) {
      const result = await startLessonAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishTeacherExperienceEvent({
          type: "teacher.lesson_planned",
          organizationId,
          recordType: "instructional_session",
          recordId: String(formData.get("session_id") ?? "session"),
          payload: { action: "start_lesson" },
        });
      }
      return result;
    },

    async completeSession(formData: FormData, organizationId?: string | null) {
      const result = await completeSessionAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishTeacherExperienceEvent({
          type: "teacher.session_completed",
          organizationId,
          recordType: "instructional_session",
          recordId: String(formData.get("session_id") ?? "session"),
        });
      }
      return result;
    },

    async updateProfile(formData: FormData, organizationId?: string | null) {
      const result = await updatePortalPreferencesAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishTeacherExperienceEvent({
          type: "teacher.profile_updated",
          organizationId,
          recordType: "teacher_preferences",
          recordId: String(formData.get("user_id") ?? "teacher"),
        });
      }
      return result;
    },

    searchDocuments: searchParentDocumentsInKnowledge,
  };
}

export type TeacherExperienceOrchestrator = ReturnType<
  typeof createTeacherExperienceOrchestrator
>;

let singleton: TeacherExperienceOrchestrator | null = null;

export function getTeacherExperience(): TeacherExperienceOrchestrator {
  if (!singleton) singleton = createTeacherExperienceOrchestrator();
  return singleton;
}
