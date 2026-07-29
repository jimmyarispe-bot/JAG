/**
 * Student Experience orchestrator — thin product layer over portal + LI + Knowledge.
 */

import { sendPortalMessageAction, updatePortalPreferencesAction } from "@/lib/portal/actions";
import {
  STUDENT_EXPERIENCE_ENGINES,
  STUDENT_EXPERIENCE_GUARDS,
  STUDENT_EXPERIENCE_NAV,
  STUDENT_QUICK_ACTIONS,
} from "./constants";
import { publishStudentExperienceEvent } from "./events";
import { searchParentDocumentsInKnowledge } from "@/lib/portal/experience/knowledge-bridge";

export function createStudentExperienceOrchestrator() {
  return {
    guards: STUDENT_EXPERIENCE_GUARDS,
    engines: STUDENT_EXPERIENCE_ENGINES,
    nav: STUDENT_EXPERIENCE_NAV,
    quickActions: STUDENT_QUICK_ACTIONS,

    publishDashboardViewed(input: {
      organizationId: string;
      actorUserId: string;
      studentId: string;
    }) {
      return publishStudentExperienceEvent({
        type: "student.dashboard_viewed",
        organizationId: input.organizationId,
        recordType: "student",
        recordId: input.studentId,
        actorUserId: input.actorUserId,
      });
    },

    publishLearningViewed(input: {
      organizationId: string;
      actorUserId?: string | null;
      studentId: string;
    }) {
      return publishStudentExperienceEvent({
        type: "student.learning_viewed",
        organizationId: input.organizationId,
        recordType: "student",
        recordId: input.studentId,
        actorUserId: input.actorUserId,
        payload: { learningIntelligence: "LearningIntelligenceEngine" },
      });
    },

    async sendMessage(formData: FormData, organizationId?: string | null) {
      const result = await sendPortalMessageAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishStudentExperienceEvent({
          type: "student.message_sent",
          organizationId,
          recordType: "portal_message",
          recordId: String(formData.get("conversation_id") ?? "message"),
        });
      }
      return result;
    },

    async updateProfile(formData: FormData, organizationId?: string | null) {
      const result = await updatePortalPreferencesAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishStudentExperienceEvent({
          type: "student.profile_updated",
          organizationId,
          recordType: "student_preferences",
          recordId: String(formData.get("user_id") ?? "student"),
        });
      }
      return result;
    },

    searchDocuments: searchParentDocumentsInKnowledge,
  };
}

export type StudentExperienceOrchestrator = ReturnType<
  typeof createStudentExperienceOrchestrator
>;

let singleton: StudentExperienceOrchestrator | null = null;

export function getStudentExperience(): StudentExperienceOrchestrator {
  if (!singleton) singleton = createStudentExperienceOrchestrator();
  return singleton;
}
