/**
 * Admissions process — stage declarations (vertical slice).
 * Declarative references only — no runtime logic.
 */

import type { StageDefinition } from "@/jag/processes";
import { ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID } from "@/packages/academy/decisions";
import { ACADEMY_ADMISSIONS_COMMUNICATION_IDS } from "@/packages/academy/communications/admissions";
import {
  ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY_ID,
  ACADEMY_ADMISSIONS_REQUIRED_DOCUMENT_IDS,
} from "@/packages/academy/documents/admissions";
import { ACADEMY_ADMISSIONS_FORM_IDS } from "@/packages/academy/forms/admissions";
import { ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS } from "@/packages/academy/processes/admissions/navigation";
import { ACADEMY_ADMISSIONS_PERMISSIONS } from "@/packages/academy/processes/admissions/permissions";

export const ACADEMY_ADMISSIONS_STAGE_IDS = {
  inquiry: "inquiry",
  applicationStarted: "application_started",
  applicationSubmitted: "application_submitted",
  review: "review",
  eligibilityDecision: "eligibility_decision",
  decisionComplete: "decision_complete",
  enrollmentInvitation: "enrollment_invitation",
  closed: "closed",
} as const;

export const ACADEMY_ADMISSIONS_STAGES: readonly StageDefinition[] =
  Object.freeze([
    Object.freeze({
      id: ACADEMY_ADMISSIONS_STAGE_IDS.inquiry,
      label: "Inquiry",
      description: "Initial inquiry captured",
      kind: "initial" as const,
      behavior: Object.freeze({
        requiresFormId: ACADEMY_ADMISSIONS_FORM_IDS.inquiry,
        metadata: Object.freeze({
          requiredPermissions: Object.freeze([
            ACADEMY_ADMISSIONS_PERMISSIONS.create,
          ]),
          availableTransitionIds: Object.freeze(["start_application"]),
          requiredDocumentDefinitionIds: Object.freeze([] as string[]),
          communicationTriggerIds: Object.freeze([
            ACADEMY_ADMISSIONS_COMMUNICATION_IDS.inquiryReceived,
          ]),
          decisionDefinitionIds: Object.freeze([] as string[]),
          navigationContributionIds: ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
        }),
      }),
    }),
    Object.freeze({
      id: ACADEMY_ADMISSIONS_STAGE_IDS.applicationStarted,
      label: "Application Started",
      description: "Applicant began the application",
      kind: "intermediate" as const,
      behavior: Object.freeze({
        requiresFormId: ACADEMY_ADMISSIONS_FORM_IDS.application,
        requiresDocumentCategory: ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY_ID,
        metadata: Object.freeze({
          requiredPermissions: Object.freeze([
            ACADEMY_ADMISSIONS_PERMISSIONS.update,
          ]),
          availableTransitionIds: Object.freeze(["submit_application"]),
          requiredDocumentDefinitionIds: Object.freeze([
            ACADEMY_ADMISSIONS_REQUIRED_DOCUMENT_IDS[0],
          ]),
          communicationTriggerIds: Object.freeze([
            ACADEMY_ADMISSIONS_COMMUNICATION_IDS.applicationStarted,
          ]),
          decisionDefinitionIds: Object.freeze([] as string[]),
          navigationContributionIds: ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
        }),
      }),
    }),
    Object.freeze({
      id: ACADEMY_ADMISSIONS_STAGE_IDS.applicationSubmitted,
      label: "Application Submitted",
      description: "Application submitted for review or eligibility",
      kind: "intermediate" as const,
      behavior: Object.freeze({
        requiresFormId: ACADEMY_ADMISSIONS_FORM_IDS.application,
        requiresDocumentCategory: ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY_ID,
        metadata: Object.freeze({
          requiredPermissions: Object.freeze([
            ACADEMY_ADMISSIONS_PERMISSIONS.read,
          ]),
          availableTransitionIds: Object.freeze([
            "begin_review",
            "advance_to_eligibility",
          ]),
          requiredDocumentDefinitionIds: ACADEMY_ADMISSIONS_REQUIRED_DOCUMENT_IDS,
          communicationTriggerIds: Object.freeze([
            ACADEMY_ADMISSIONS_COMMUNICATION_IDS.applicationSubmitted,
          ]),
          decisionDefinitionIds: Object.freeze([] as string[]),
          navigationContributionIds: ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
        }),
      }),
    }),
    Object.freeze({
      id: ACADEMY_ADMISSIONS_STAGE_IDS.review,
      label: "Review",
      description: "Optional staff review / missing-document loop",
      kind: "intermediate" as const,
      behavior: Object.freeze({
        requiresDocumentCategory: ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY_ID,
        metadata: Object.freeze({
          requiredPermissions: Object.freeze([
            ACADEMY_ADMISSIONS_PERMISSIONS.read,
            ACADEMY_ADMISSIONS_PERMISSIONS.update,
          ]),
          availableTransitionIds: Object.freeze([
            "request_documents",
            "advance_to_eligibility_from_review",
          ]),
          requiredDocumentDefinitionIds: ACADEMY_ADMISSIONS_REQUIRED_DOCUMENT_IDS,
          communicationTriggerIds: Object.freeze([
            ACADEMY_ADMISSIONS_COMMUNICATION_IDS.missingDocuments,
          ]),
          decisionDefinitionIds: Object.freeze([] as string[]),
          navigationContributionIds: ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
        }),
      }),
    }),
    Object.freeze({
      id: ACADEMY_ADMISSIONS_STAGE_IDS.eligibilityDecision,
      label: "Admissions Eligibility Decision",
      description: "Evaluate eligibility via Decision Engine",
      kind: "intermediate" as const,
      behavior: Object.freeze({
        metadata: Object.freeze({
          requiredPermissions: Object.freeze([
            ACADEMY_ADMISSIONS_PERMISSIONS.decide,
          ]),
          availableTransitionIds: Object.freeze([
            "record_decision_complete",
            "decline_and_close",
          ]),
          requiredDocumentDefinitionIds: ACADEMY_ADMISSIONS_REQUIRED_DOCUMENT_IDS,
          communicationTriggerIds: Object.freeze([] as string[]),
          decisionDefinitionIds: Object.freeze([
            ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID,
          ]),
          navigationContributionIds: ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
        }),
      }),
    }),
    Object.freeze({
      id: ACADEMY_ADMISSIONS_STAGE_IDS.decisionComplete,
      label: "Decision Complete",
      description: "Eligibility decision recorded; notify applicant",
      kind: "intermediate" as const,
      behavior: Object.freeze({
        metadata: Object.freeze({
          requiredPermissions: Object.freeze([
            ACADEMY_ADMISSIONS_PERMISSIONS.decide,
          ]),
          availableTransitionIds: Object.freeze(["invite_to_enroll"]),
          requiredDocumentDefinitionIds: Object.freeze([] as string[]),
          communicationTriggerIds: Object.freeze([
            ACADEMY_ADMISSIONS_COMMUNICATION_IDS.decisionAvailable,
          ]),
          decisionDefinitionIds: Object.freeze([
            ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID,
          ]),
          navigationContributionIds: ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
        }),
      }),
    }),
    Object.freeze({
      id: ACADEMY_ADMISSIONS_STAGE_IDS.enrollmentInvitation,
      label: "Enrollment Invitation",
      description: "Accepted applicant invited to enroll",
      kind: "intermediate" as const,
      behavior: Object.freeze({
        requiresFormId: ACADEMY_ADMISSIONS_FORM_IDS.student,
        metadata: Object.freeze({
          requiredPermissions: Object.freeze([
            ACADEMY_ADMISSIONS_PERMISSIONS.enroll,
          ]),
          availableTransitionIds: Object.freeze(["complete_and_close"]),
          requiredDocumentDefinitionIds: Object.freeze([] as string[]),
          communicationTriggerIds: Object.freeze([
            ACADEMY_ADMISSIONS_COMMUNICATION_IDS.enrollmentInvitation,
          ]),
          decisionDefinitionIds: Object.freeze([] as string[]),
          navigationContributionIds: ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
        }),
      }),
    }),
    Object.freeze({
      id: ACADEMY_ADMISSIONS_STAGE_IDS.closed,
      label: "Closed",
      description: "Process completed or declined",
      kind: "terminal" as const,
      behavior: Object.freeze({
        metadata: Object.freeze({
          requiredPermissions: Object.freeze([
            ACADEMY_ADMISSIONS_PERMISSIONS.read,
          ]),
          availableTransitionIds: Object.freeze([] as string[]),
          requiredDocumentDefinitionIds: Object.freeze([] as string[]),
          communicationTriggerIds: Object.freeze([] as string[]),
          decisionDefinitionIds: Object.freeze([] as string[]),
          navigationContributionIds: ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
        }),
      }),
    }),
  ]);
