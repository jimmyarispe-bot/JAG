/**
 * Admissions Experience orchestrator — thin product layer over existing services.
 * Does not recreate validation, CRM, finance, or document models.
 */

import {
  saveApplicationDetails,
  saveFinancialAidApplication,
  startApplication,
  submitApplication,
  submitPublicInquiry,
  uploadPortalDocument,
} from "@/lib/admissions/portal/actions";
import {
  generateEnrollmentPacket,
  getEnrollmentPacket,
  signEnrollmentDocument,
} from "@/lib/admissions/enrollment-packets";
import { scheduleInterview, scheduleTour } from "@/lib/admissions/actions";
import { inviteParentPortalGuardians } from "@/lib/families/portal-invite";
import {
  ADMISSIONS_EXPERIENCE_ENGINES,
  ADMISSIONS_EXPERIENCE_GUARDS,
  APPLICATION_WIZARD_STEPS,
  toDashboardStatus,
} from "./constants";
import { publishAdmissionsExperienceEvent } from "./events";
import { linkAdmissionsDocumentToKnowledge } from "./knowledge-bridge";

function encodeInquiryExtras(formData: FormData): void {
  const referral = String(formData.get("referral_source") ?? "").trim();
  const concerns = String(formData.get("learning_concerns") ?? "").trim();
  const preferred = String(formData.get("preferred_contact_method") ?? "").trim();
  const parts = [
    referral,
    preferred ? `preferred_contact:${preferred}` : "",
    concerns ? `learning_concerns:${concerns}` : "",
  ].filter(Boolean);
  if (parts.length) {
    formData.set("referral_source", parts.join(" | "));
  }
}

export function createAdmissionsExperienceOrchestrator() {
  return {
    guards: ADMISSIONS_EXPERIENCE_GUARDS,
    engines: ADMISSIONS_EXPERIENCE_ENGINES,
    wizardSteps: APPLICATION_WIZARD_STEPS,
    toDashboardStatus,

    async submitInterest(formData: FormData, organizationId?: string | null) {
      encodeInquiryExtras(formData);
      const result = await submitPublicInquiry(formData);
      if ("leadId" in result && result.leadId) {
        publishAdmissionsExperienceEvent({
          type: "admissions.inquiry_submitted",
          organizationId: organizationId ?? "default",
          recordType: "admissions_lead",
          recordId: String(result.leadId),
          payload: {
            program: String(formData.get("program") ?? ""),
            schoolId: String(formData.get("school_id") ?? ""),
          },
        });
      }
      return result;
    },

    async requestDiscoveryCall(
      formData: FormData,
      organizationId?: string | null
    ) {
      encodeInquiryExtras(formData);
      if (!formData.get("referral_source")) {
        formData.set("referral_source", "discovery_call");
      }
      const preferredAt = String(formData.get("preferred_at") ?? "");
      const result = await submitPublicInquiry(formData);
      if ("leadId" in result && result.leadId) {
        publishAdmissionsExperienceEvent({
          type: "admissions.discovery_requested",
          organizationId: organizationId ?? "default",
          recordType: "admissions_lead",
          recordId: String(result.leadId),
          payload: {
            preferredAt,
            tourType: String(formData.get("tour_type") ?? "virtual"),
          },
        });
      }
      return result;
    },

    async requestAssessment(
      formData: FormData,
      organizationId?: string | null
    ) {
      encodeInquiryExtras(formData);
      if (!formData.get("referral_source")) {
        formData.set("referral_source", "assessment_request");
      }
      const areas = String(formData.get("areas_of_concern") ?? "");
      const result = await submitPublicInquiry(formData);
      if ("leadId" in result && result.leadId) {
        publishAdmissionsExperienceEvent({
          type: "admissions.assessment_requested",
          organizationId: organizationId ?? "default",
          recordType: "admissions_lead",
          recordId: String(result.leadId),
          payload: {
            areasOfConcern: areas,
            preferredAt: String(formData.get("preferred_at") ?? ""),
            learningIntelligence: "LearningIntelligenceEngine",
          },
        });
      }
      return result;
    },

    async startApplication(leadId: string, schoolYearId: string) {
      return startApplication(leadId, schoolYearId);
    },

    async saveApplicationDraft(
      formData: FormData,
      organizationId?: string | null
    ) {
      const result = await saveApplicationDetails(formData);
      if (!result.error) {
        publishAdmissionsExperienceEvent({
          type: "admissions.application_draft_saved",
          organizationId: organizationId ?? "default",
          recordType: "admissions_application",
          recordId: String(formData.get("application_id") ?? ""),
          payload: {
            step: String(formData.get("wizard_step") ?? "unknown"),
          },
        });
      }
      return result;
    },

    async submitApplication(
      applicationId: string,
      organizationId?: string | null
    ) {
      const result = await submitApplication(applicationId);
      if ("success" in result && result.success) {
        publishAdmissionsExperienceEvent({
          type: "admissions.application_submitted",
          organizationId: organizationId ?? "default",
          recordType: "admissions_application",
          recordId: applicationId,
          payload: {
            autoAccepted: "autoAccepted" in result ? String(result.autoAccepted) : "false",
          },
        });
      }
      return result;
    },

    async uploadDocument(
      formData: FormData,
      opts?: {
        organizationId?: string | null;
        userId?: string | null;
        fileContentBase64?: string | null;
      }
    ) {
      const result = await uploadPortalDocument(formData);
      if (result.error) return result;

      const organizationId = opts?.organizationId;
      const userId = opts?.userId;
      const content = opts?.fileContentBase64;
      if (organizationId && userId && content) {
        await linkAdmissionsDocumentToKnowledge({
          organizationId,
          userId,
          applicationId: String(formData.get("application_id") ?? ""),
          documentType: String(formData.get("document_type") ?? "other"),
          fileName: String(
            formData.get("file_name") ??
              (formData.get("file") instanceof File
                ? (formData.get("file") as File).name
                : "document")
          ),
          mimeType:
            formData.get("file") instanceof File
              ? (formData.get("file") as File).type
              : null,
          content,
        });
      }

      return result;
    },

    async scheduleStaffTour(formData: FormData, organizationId?: string | null) {
      const result = await scheduleTour(formData);
      if (!("error" in result && result.error)) {
        publishAdmissionsExperienceEvent({
          type: "admissions.discovery_requested",
          organizationId: organizationId ?? "default",
          recordType: "admissions_lead",
          recordId: String(formData.get("lead_id") ?? ""),
          payload: {
            scheduledAt: String(formData.get("scheduled_at") ?? ""),
            staffScheduled: "true",
          },
        });
      }
      return result;
    },

    async scheduleStaffInterview(
      formData: FormData,
      organizationId?: string | null
    ) {
      const result = await scheduleInterview(formData);
      if (!("error" in result && result.error)) {
        publishAdmissionsExperienceEvent({
          type: "admissions.interview_scheduled",
          organizationId: organizationId ?? "default",
          recordType: "admissions_lead",
          recordId: String(formData.get("lead_id") ?? ""),
          payload: {
            scheduledAt: String(formData.get("scheduled_at") ?? ""),
            interviewType: String(formData.get("interview_type") ?? ""),
          },
        });
      }
      return result;
    },

    async generateOffer(
      applicationId: string,
      leadId: string,
      organizationId?: string | null
    ) {
      const result = await generateEnrollmentPacket(applicationId, leadId);
      if (!("error" in result && result.error)) {
        publishAdmissionsExperienceEvent({
          type: "admissions.offer_generated",
          organizationId: organizationId ?? "default",
          recordType: "enrollment_packet",
          recordId:
            "packetId" in result ? String(result.packetId) : applicationId,
          payload: { applicationId, leadId },
        });
      }
      return result;
    },

    async getOffer(applicationId: string) {
      return getEnrollmentPacket(applicationId);
    },

    async signContract(
      formData: FormData,
      organizationId?: string | null
    ) {
      const result = await signEnrollmentDocument(formData);
      if (!("error" in result && result.error)) {
        publishAdmissionsExperienceEvent({
          type: "admissions.contract_signed",
          organizationId: organizationId ?? "default",
          recordType: "enrollment_packet_signature",
          recordId: String(formData.get("enrollment_packet_id") ?? ""),
          payload: {
            templateKey: String(formData.get("template_key") ?? ""),
            knowledgeStoresExecuted: "true",
          },
        });
      }
      return result;
    },

    async saveScholarship(
      formData: FormData,
      organizationId?: string | null
    ) {
      const result = await saveFinancialAidApplication(formData);
      if (!result.error) {
        publishAdmissionsExperienceEvent({
          type: "admissions.scholarship_updated",
          organizationId: organizationId ?? "default",
          recordType: "scholarship_application",
          recordId: String(
            formData.get("scholarship_application_id") ??
              formData.get("application_id") ??
              ""
          ),
          payload: {
            requestedAmount: String(formData.get("requested_amount") ?? ""),
            financeEngine: "FinanceEngine",
          },
        });
      }
      return result;
    },

    async inviteParentOnboarding(input: {
      organizationId: string;
      schoolId: string;
      guardians: {
        first_name: string;
        last_name: string;
        email?: string | null;
      }[];
      organizationName?: string;
    }) {
      const result = await inviteParentPortalGuardians(input);
      publishAdmissionsExperienceEvent({
        type: "admissions.parent_onboarding",
        organizationId: input.organizationId,
        recordType: "parent_portal_invite",
        recordId: input.schoolId,
        payload: {
          invited: String(result.invited),
          identityEngine: "IdentityEngine",
        },
      });
      return result;
    },

    publishTuitionSetup(input: {
      organizationId: string;
      applicationId: string;
      actorUserId?: string | null;
    }) {
      return publishAdmissionsExperienceEvent({
        type: "admissions.tuition_setup",
        organizationId: input.organizationId,
        recordType: "admissions_application",
        recordId: input.applicationId,
        actorUserId: input.actorUserId,
        payload: { financeEngine: "FinanceEngine" },
      });
    },
  };
}

export type AdmissionsExperienceOrchestrator = ReturnType<
  typeof createAdmissionsExperienceOrchestrator
>;

let singleton: AdmissionsExperienceOrchestrator | null = null;

export function getAdmissionsExperience(): AdmissionsExperienceOrchestrator {
  if (!singleton) singleton = createAdmissionsExperienceOrchestrator();
  return singleton;
}
