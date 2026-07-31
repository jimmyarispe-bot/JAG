/**
 * AcademyAdmissionsProcessDefinition — declarative Process Engine contribution.
 * No runtime / business logic.
 */

import type { ProcessDefinition } from "@/jag/processes";
import { ACADEMY_APPLICATION_ID, ACADEMY_PACKAGE_VERSION } from "@/packages/academy/package";
import {
  ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATE_ID_LIST,
} from "@/packages/academy/processes/admissions/communications";
import {
  ACADEMY_DECISION_DEFINITION_IDS,
} from "@/packages/academy/decisions";
import {
  ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY_ID,
} from "@/packages/academy/processes/admissions/documents";
import {
  ACADEMY_ADMISSIONS_FORM_DEFINITION_IDS,
} from "@/packages/academy/processes/admissions/forms";
import {
  ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
} from "@/packages/academy/processes/admissions/navigation";
import { ACADEMY_ADMISSIONS_PERMISSIONS } from "@/packages/academy/processes/admissions/permissions";
import {
  ACADEMY_ADMISSIONS_STAGE_IDS,
  ACADEMY_ADMISSIONS_STAGES,
} from "@/packages/academy/processes/admissions/stages";
import { ACADEMY_ADMISSIONS_TRANSITIONS } from "@/packages/academy/processes/admissions/transitions";

export const ACADEMY_ADMISSIONS_PROCESS_ID =
  "academy.process.admissions" as const;

export const AcademyAdmissionsProcessDefinition: ProcessDefinition =
  Object.freeze({
    id: ACADEMY_ADMISSIONS_PROCESS_ID,
    applicationId: ACADEMY_APPLICATION_ID,
    version: ACADEMY_PACKAGE_VERSION,
    label: "Academy Admissions",
    description:
      "Declarative admissions business process for the Academy package. Orchestrates forms, documents, communications, decisions, workflows, entities, and navigation by reference.",
    initialStageId: ACADEMY_ADMISSIONS_STAGE_IDS.inquiry,
    stages: ACADEMY_ADMISSIONS_STAGES,
    transitions: ACADEMY_ADMISSIONS_TRANSITIONS,
    participants: Object.freeze([
      Object.freeze({ role: "applicant" }),
      Object.freeze({ role: "reviewer" }),
      Object.freeze({ role: "approver" }),
    ]),
    permissions: Object.freeze([
      Object.freeze({
        action: "start" as const,
        permissionKey: ACADEMY_ADMISSIONS_PERMISSIONS.start,
      }),
      Object.freeze({
        action: "transition" as const,
        permissionKey: ACADEMY_ADMISSIONS_PERMISSIONS.transition,
      }),
      Object.freeze({
        action: "view" as const,
        permissionKey: ACADEMY_ADMISSIONS_PERMISSIONS.read,
      }),
      Object.freeze({
        action: "complete" as const,
        permissionKey: ACADEMY_ADMISSIONS_PERMISSIONS.enroll,
      }),
    ]),
    extensions: Object.freeze({
      workflowDefinitionId: "academyos.admissions",
      formDefinitionIds: ACADEMY_ADMISSIONS_FORM_DEFINITION_IDS,
      entityTypeIds: Object.freeze([
        "Inquiry",
        "Application",
        "Student",
      ] as const),
      documentCategoryIds: Object.freeze([
        ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY_ID,
      ] as const),
      communicationTemplateIds: ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATE_ID_LIST,
      decisionDefinitionIds: ACADEMY_DECISION_DEFINITION_IDS,
      navigationModuleIds: ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS,
    }),
  });
