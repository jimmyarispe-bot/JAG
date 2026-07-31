/**
 * Academy Admissions communication templates — package contributions only.
 * Communications Engine owns delivery; no providers here.
 */

import type {
  CommunicationDefinition,
  CommunicationTemplate,
} from "@/jag/communications";
import { ACADEMY_APPLICATION_ID } from "@/packages/academy/package";

export const ACADEMY_ADMISSIONS_COMMUNICATION_IDS = {
  inquiryReceived: "academy.communication.admissions.inquiry_received",
  applicationStarted: "academy.communication.admissions.application_started",
  missingDocuments: "academy.communication.admissions.missing_documents",
  applicationSubmitted: "academy.communication.admissions.application_submitted",
  decisionAvailable: "academy.communication.admissions.decision_available",
  enrollmentInvitation: "academy.communication.admissions.enrollment_invitation",
} as const;

export const ACADEMY_ADMISSIONS_TEMPLATE_IDS = {
  inquiryReceived:
    "academy.communication.admissions.inquiry_received.template",
  applicationStarted:
    "academy.communication.admissions.application_started.template",
  missingDocuments:
    "academy.communication.admissions.missing_documents.template",
  applicationSubmitted:
    "academy.communication.admissions.application_submitted.template",
  decisionAvailable:
    "academy.communication.admissions.decision_available.template",
  enrollmentInvitation:
    "academy.communication.admissions.enrollment_invitation.template",
} as const;

function definition(input: {
  id: string;
  label: string;
  description: string;
  templateId: string;
}): CommunicationDefinition {
  return Object.freeze({
    id: input.id,
    applicationId: ACADEMY_APPLICATION_ID,
    version: "1.0.0",
    label: input.label,
    description: input.description,
    defaultChannel: "email" as const,
    allowedChannels: Object.freeze([
      "email" as const,
      "in-app" as const,
    ]),
    templateIds: Object.freeze([input.templateId]),
  });
}

export const ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITIONS: readonly CommunicationDefinition[] =
  Object.freeze([
    definition({
      id: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.inquiryReceived,
      label: "Inquiry Received",
      description: "Acknowledge an admissions inquiry",
      templateId: ACADEMY_ADMISSIONS_TEMPLATE_IDS.inquiryReceived,
    }),
    definition({
      id: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.applicationStarted,
      label: "Application Started",
      description: "Confirm the applicant started an application",
      templateId: ACADEMY_ADMISSIONS_TEMPLATE_IDS.applicationStarted,
    }),
    definition({
      id: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.missingDocuments,
      label: "Missing Documents",
      description: "Request missing admissions documents",
      templateId: ACADEMY_ADMISSIONS_TEMPLATE_IDS.missingDocuments,
    }),
    definition({
      id: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.applicationSubmitted,
      label: "Application Submitted",
      description: "Acknowledge that an application was submitted",
      templateId: ACADEMY_ADMISSIONS_TEMPLATE_IDS.applicationSubmitted,
    }),
    definition({
      id: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.decisionAvailable,
      label: "Decision Available",
      description: "Notify that an admissions decision is available",
      templateId: ACADEMY_ADMISSIONS_TEMPLATE_IDS.decisionAvailable,
    }),
    definition({
      id: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.enrollmentInvitation,
      label: "Enrollment Invitation",
      description: "Invite an accepted applicant to enroll",
      templateId: ACADEMY_ADMISSIONS_TEMPLATE_IDS.enrollmentInvitation,
    }),
  ]);

function template(input: {
  id: string;
  definitionId: string;
  label: string;
  subject: string;
  body: string;
}): CommunicationTemplate {
  return Object.freeze({
    id: input.id,
    definitionId: input.definitionId,
    label: input.label,
    subject: input.subject,
    body: input.body,
    variables: Object.freeze(["recipient.name", "application.id", "status"]),
  });
}

export const ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATES: readonly CommunicationTemplate[] =
  Object.freeze([
    template({
      id: ACADEMY_ADMISSIONS_TEMPLATE_IDS.inquiryReceived,
      definitionId: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.inquiryReceived,
      label: "Inquiry received",
      subject: "We received your inquiry",
      body: "Hello {{recipient.name}}, we received your admissions inquiry. Status: {{status}}.",
    }),
    template({
      id: ACADEMY_ADMISSIONS_TEMPLATE_IDS.applicationStarted,
      definitionId: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.applicationStarted,
      label: "Application started",
      subject: "Your application {{application.id}} has been started",
      body: "Hello {{recipient.name}}, application {{application.id}} is in progress. Status: {{status}}.",
    }),
    template({
      id: ACADEMY_ADMISSIONS_TEMPLATE_IDS.missingDocuments,
      definitionId: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.missingDocuments,
      label: "Missing documents",
      subject: "Action needed: missing admissions documents",
      body: "Hello {{recipient.name}}, application {{application.id}} is missing required documents. Status: {{status}}.",
    }),
    template({
      id: ACADEMY_ADMISSIONS_TEMPLATE_IDS.applicationSubmitted,
      definitionId: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.applicationSubmitted,
      label: "Application submitted",
      subject: "Application {{application.id}} submitted",
      body: "Hello {{recipient.name}}, we received application {{application.id}}. Status: {{status}}.",
    }),
    template({
      id: ACADEMY_ADMISSIONS_TEMPLATE_IDS.decisionAvailable,
      definitionId: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.decisionAvailable,
      label: "Decision available",
      subject: "Your admissions decision is available",
      body: "Hello {{recipient.name}}, a decision is available for application {{application.id}}. Status: {{status}}.",
    }),
    template({
      id: ACADEMY_ADMISSIONS_TEMPLATE_IDS.enrollmentInvitation,
      definitionId: ACADEMY_ADMISSIONS_COMMUNICATION_IDS.enrollmentInvitation,
      label: "Enrollment invitation",
      subject: "You are invited to enroll — {{application.id}}",
      body: "Hello {{recipient.name}}, you are invited to enroll for application {{application.id}}. Status: {{status}}.",
    }),
  ]);

export const ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITION_IDS = Object.freeze(
  ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITIONS.map((d) => d.id)
);

export const ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATE_ID_LIST = Object.freeze(
  ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATES.map((t) => t.id)
);

/** @deprecated Sprint 011 alias — use applicationSubmitted. */
export const ACADEMY_ADMISSIONS_LEGACY_APPLICATION_RECEIVED_ID =
  "academy.communication.admissions.application_received" as const;
