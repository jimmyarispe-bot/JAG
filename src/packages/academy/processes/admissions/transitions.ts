/**
 * Admissions process — stage transitions (vertical slice).
 */

import type { StageTransition } from "@/jag/processes";
import { ACADEMY_ADMISSIONS_PERMISSIONS } from "@/packages/academy/processes/admissions/permissions";
import { ACADEMY_ADMISSIONS_STAGE_IDS } from "@/packages/academy/processes/admissions/stages";

export const ACADEMY_ADMISSIONS_TRANSITIONS: readonly StageTransition[] =
  Object.freeze([
    Object.freeze({
      id: "start_application",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.inquiry,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.applicationStarted,
      label: "Start Application",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.create,
    }),
    Object.freeze({
      id: "submit_application",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.applicationStarted,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.applicationSubmitted,
      label: "Submit Application",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.update,
    }),
    Object.freeze({
      id: "begin_review",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.applicationSubmitted,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.review,
      label: "Begin Review",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.update,
    }),
    Object.freeze({
      id: "request_documents",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.review,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.review,
      label: "Request Documents",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.update,
      guardKey: "admissions.request_documents",
    }),
    Object.freeze({
      id: "advance_to_eligibility",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.applicationSubmitted,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.eligibilityDecision,
      label: "Advance to Eligibility Decision",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.approve,
    }),
    Object.freeze({
      id: "advance_to_eligibility_from_review",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.review,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.eligibilityDecision,
      label: "Advance to Eligibility Decision",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.approve,
    }),
    Object.freeze({
      id: "record_decision_complete",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.eligibilityDecision,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.decisionComplete,
      label: "Record Decision Complete",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.decide,
      guardKey: "admissions.accept",
    }),
    Object.freeze({
      id: "decline_and_close",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.eligibilityDecision,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.closed,
      label: "Decline and Close",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.decide,
      guardKey: "admissions.decline",
    }),
    Object.freeze({
      id: "invite_to_enroll",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.decisionComplete,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.enrollmentInvitation,
      label: "Send Enrollment Invitation",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.enroll,
    }),
    Object.freeze({
      id: "complete_and_close",
      from: ACADEMY_ADMISSIONS_STAGE_IDS.enrollmentInvitation,
      to: ACADEMY_ADMISSIONS_STAGE_IDS.closed,
      label: "Complete and Close",
      guardPermission: ACADEMY_ADMISSIONS_PERMISSIONS.enroll,
    }),
  ]);
