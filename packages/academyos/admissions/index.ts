export {
  ADMISSIONS_STAGES,
  ASSESSMENT_STATUSES,
  DOCUMENT_REQUIREMENT_TYPES,
  DOCUMENT_STATUSES,
  ENROLLMENT_WIZARD_SECTIONS,
  SCHOLARSHIP_STATUSES,
  TERMINAL_STAGES,
  type AcademyApplicant,
  type AdmissionsAuditEntry,
  type AdmissionsDashboardMetrics,
  type AdmissionsNotification,
  type AdmissionsStage,
  type AdmissionsSummary,
  type AdmissionsTimelineEntry,
  type ApplicantDocument,
  type ApplicantScholarshipStatus,
  type AssessmentStatus,
  type DocumentRequirementType,
  type DocumentStatus,
  type DuplicateMatch,
  type EnrollmentWizardSection,
  type EnrollmentWizardState,
  type GuardianInfo,
  type StudentInfo,
} from "./types";
export { resetAdmissionsStoreForTests } from "./store";
export {
  listTimeline as listAdmissionsTimeline,
  listAudit as listAdmissionsAudit,
  listNotifications as listAdmissionsNotifications,
} from "./store";
export { canTransitionStage, isAdmissionsStage } from "./pipeline";
export { createApplicantsService } from "./applicants";
export { createDocumentsService } from "./documents";
export { createEnrollmentWizardService } from "./enrollment-wizard";
export { createAdmissionsScholarshipService } from "./scholarships";
export { createParentPortalService } from "./parent-portal";
export { createNotificationsService } from "./notifications";
export {
  buildAdmissionsDashboard,
  buildAdmissionsSummary,
} from "./dashboard";
export {
  createAdmissionsReportingService,
  type AdmissionsReport,
  type AdmissionsReportKind,
} from "./reporting";
export { findDuplicateApplicants } from "./duplicates";

/** @deprecated Use createApplicantsService — kept for Sprint 2.1 compat. */
export { createAdmissionsService } from "../domain/services";
