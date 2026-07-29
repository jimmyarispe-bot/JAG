/**
 * Parent Experience orchestrator — thin product layer over existing portal services.
 */

import {
  sendPortalMessageAction,
  submitPortalFormAction,
  updatePortalPreferencesAction,
  requestConferenceAction,
} from "@/lib/portal/actions";
import {
  PARENT_EXPERIENCE_ENGINES,
  PARENT_EXPERIENCE_GUARDS,
  PARENT_EXPERIENCE_NAV,
  PARENT_QUICK_ACTIONS,
} from "./constants";
import { publishParentExperienceEvent } from "./events";
import {
  publishDocumentViewed,
  searchParentDocumentsInKnowledge,
} from "./knowledge-bridge";

export function createParentExperienceOrchestrator() {
  return {
    guards: PARENT_EXPERIENCE_GUARDS,
    engines: PARENT_EXPERIENCE_ENGINES,
    nav: PARENT_EXPERIENCE_NAV,
    quickActions: PARENT_QUICK_ACTIONS,

    publishDashboardViewed(input: {
      organizationId: string;
      actorUserId: string;
      studentCount: number;
    }) {
      return publishParentExperienceEvent({
        type: "parent.dashboard_viewed",
        organizationId: input.organizationId,
        recordType: "parent_portal",
        recordId: input.actorUserId,
        actorUserId: input.actorUserId,
        payload: { studentCount: String(input.studentCount) },
      });
    },

    async sendMessage(formData: FormData, organizationId?: string | null) {
      const result = await sendPortalMessageAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishParentExperienceEvent({
          type: "parent.message_sent",
          organizationId,
          recordType: "portal_message",
          recordId: String(formData.get("conversation_id") ?? "message"),
          payload: { category: String(formData.get("category") ?? "") },
        });
      }
      return result;
    },

    async signForm(formData: FormData, organizationId?: string | null) {
      const result = await submitPortalFormAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishParentExperienceEvent({
          type: "parent.form_signed",
          organizationId,
          recordType: "portal_form",
          recordId: String(formData.get("form_id") ?? "form"),
          payload: {},
        });
      }
      return result;
    },

    async updateProfile(formData: FormData, organizationId?: string | null) {
      const result = await updatePortalPreferencesAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishParentExperienceEvent({
          type: "parent.profile_updated",
          organizationId,
          recordType: "guardian_preferences",
          recordId: String(formData.get("user_id") ?? "guardian"),
          payload: {
            language: String(formData.get("language") ?? ""),
          },
        });
      }
      return result;
    },

    async scheduleMeeting(formData: FormData, organizationId?: string | null) {
      const result = await requestConferenceAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishParentExperienceEvent({
          type: "parent.support_ticket_opened",
          organizationId,
          recordType: "conference_request",
          recordId: String(formData.get("student_id") ?? "meeting"),
          payload: { kind: "schedule_meeting" },
        });
      }
      return result;
    },

    searchDocuments: searchParentDocumentsInKnowledge,
    viewDocument: publishDocumentViewed,

    publishPaymentInitiated(input: {
      organizationId: string;
      actorUserId?: string | null;
      invoiceId: string;
    }) {
      return publishParentExperienceEvent({
        type: "parent.payment_initiated",
        organizationId: input.organizationId,
        recordType: "invoice",
        recordId: input.invoiceId,
        actorUserId: input.actorUserId,
        payload: { financeEngine: "FinanceEngine" },
      });
    },

    publishExcuseRequest(input: {
      organizationId: string;
      actorUserId?: string | null;
      studentId: string;
      date: string;
    }) {
      return publishParentExperienceEvent({
        type: "parent.attendance_excuse_requested",
        organizationId: input.organizationId,
        recordType: "student",
        recordId: input.studentId,
        actorUserId: input.actorUserId,
        payload: { date: input.date },
      });
    },

    publishSupportTicket(input: {
      organizationId: string;
      actorUserId?: string | null;
      subject: string;
    }) {
      return publishParentExperienceEvent({
        type: "parent.support_ticket_opened",
        organizationId: input.organizationId,
        recordType: "support_request",
        recordId: randomId(),
        actorUserId: input.actorUserId,
        payload: { subject: input.subject },
      });
    },
  };
}

function randomId() {
  return `sup_${Date.now().toString(36)}`;
}

export type ParentExperienceOrchestrator = ReturnType<
  typeof createParentExperienceOrchestrator
>;

let singleton: ParentExperienceOrchestrator | null = null;

export function getParentExperience(): ParentExperienceOrchestrator {
  if (!singleton) singleton = createParentExperienceOrchestrator();
  return singleton;
}
