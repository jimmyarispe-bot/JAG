/** Admissions & Enrollment Production™ — deterministic pipeline types. */

export const ADMISSIONS_STAGES = [
  "Inquiry",
  "Application Started",
  "Application Submitted",
  "Document Review",
  "Assessment Scheduled",
  "Assessment Complete",
  "Admissions Review",
  "Accepted",
  "Enrollment Pending",
  "Enrolled",
  "Declined",
  "Withdrawn",
] as const;
export type AdmissionsStage = (typeof ADMISSIONS_STAGES)[number];

/** Terminal stages (no forward progress). */
export const TERMINAL_STAGES: readonly AdmissionsStage[] = [
  "Enrolled",
  "Declined",
  "Withdrawn",
];

export const DOCUMENT_REQUIREMENT_TYPES = [
  "Birth Certificate",
  "Immunization Records",
  "Previous Report Cards",
  "IEP",
  "Psychological Evaluation",
  "Scholarship Documentation",
  "Residency Verification",
  "Parent Identification",
] as const;
export type DocumentRequirementType =
  (typeof DOCUMENT_REQUIREMENT_TYPES)[number];

export const DOCUMENT_STATUSES = [
  "Required",
  "Uploaded",
  "Reviewed",
  "Approved",
  "Rejected",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const ASSESSMENT_STATUSES = [
  "Not Required",
  "Awaiting Schedule",
  "Scheduled",
  "Complete",
  "Waived",
] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const SCHOLARSHIP_STATUSES = [
  "None",
  "Interested",
  "Applied",
  "Eligible",
  "Awarded",
  "Declined",
  "Documentation Pending",
] as const;
export type ApplicantScholarshipStatus =
  (typeof SCHOLARSHIP_STATUSES)[number];

export const ENROLLMENT_WIZARD_SECTIONS = [
  "Student Information",
  "Parent/Guardian",
  "Emergency Contacts",
  "Medical Information",
  "Educational History",
  "Scholarships",
  "Tuition Plan",
  "Agreements & Policies",
  "Final Review",
] as const;
export type EnrollmentWizardSection =
  (typeof ENROLLMENT_WIZARD_SECTIONS)[number];

export type StudentInfo = {
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: string;
  readonly gradeLevel: string;
  readonly email?: string | null;
};

export type GuardianInfo = {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly relationship: string;
};

export type AcademyApplicant = {
  readonly id: string;
  readonly organizationId: string;
  readonly student: StudentInfo;
  readonly guardian: GuardianInfo;
  readonly schoolId: string | null;
  readonly schoolName: string | null;
  readonly program: string;
  readonly gradeLevel: string;
  readonly stage: AdmissionsStage;
  readonly assignedAdvisor: string | null;
  readonly scholarshipStatus: ApplicantScholarshipStatus;
  readonly scholarshipId: string | null;
  readonly scholarshipAmount: number;
  readonly assessmentStatus: AssessmentStatus;
  readonly assessmentScheduledAt: string | null;
  readonly enrollmentStatus: "Not Started" | "In Progress" | "Complete";
  readonly enrollmentWizardId: string | null;
  readonly parentAccessToken: string;
  readonly requiredDocumentTypes: readonly DocumentRequirementType[];
  readonly twinEntityId: string | null;
  readonly inquiredAt: string;
  readonly submittedAt: string | null;
  readonly acceptedAt: string | null;
  readonly enrolledAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type ApplicantDocument = {
  readonly id: string;
  readonly organizationId: string;
  readonly applicantId: string;
  readonly type: DocumentRequirementType;
  readonly status: DocumentStatus;
  readonly fileName: string | null;
  readonly reviewedBy: string | null;
  readonly rejectionReason: string | null;
  readonly expiresAt: string | null;
  readonly uploadedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type DocumentRequirementConfig = {
  readonly organizationId: string;
  readonly program: string;
  readonly gradeLevel: string | null;
  readonly types: readonly DocumentRequirementType[];
};

export type EnrollmentWizardState = {
  readonly id: string;
  readonly organizationId: string;
  readonly applicantId: string;
  readonly currentSection: EnrollmentWizardSection;
  readonly completedSections: readonly EnrollmentWizardSection[];
  readonly data: Readonly<Record<string, string>>;
  readonly status: "In Progress" | "Submitted" | "Accepted";
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type AdmissionsTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly applicantId: string;
  readonly kind: string;
  readonly message: string;
  readonly actor: string;
  readonly at: string;
  readonly metadata: Readonly<Record<string, string>>;
};

export type AdmissionsAuditEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly applicantId: string;
  readonly action: string;
  readonly actor: string;
  readonly at: string;
  readonly details: Readonly<Record<string, string>>;
};

export type AdmissionsNotification = {
  readonly id: string;
  readonly organizationId: string;
  readonly applicantId: string;
  readonly channel: "in_app";
  readonly template:
    | "application_received"
    | "missing_documents"
    | "assessment_scheduled"
    | "acceptance"
    | "enrollment_reminder"
    | "enrollment_completed";
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly readAt: string | null;
};

export type DuplicateMatch = {
  readonly applicantId: string;
  readonly score: number;
  readonly matchedOn: readonly string[];
  readonly studentName: string;
  readonly stage: AdmissionsStage;
};

export type AdmissionsDashboardMetrics = {
  readonly newInquiries: number;
  readonly applicationsStarted: number;
  readonly applicationsSubmitted: number;
  readonly missingDocuments: number;
  readonly assessmentsAwaitingScheduling: number;
  readonly pendingAdmissionsDecisions: number;
  readonly acceptedAwaitingEnrollment: number;
  readonly enrolledThisMonth: number;
  readonly conversionRate: number;
  readonly averageDaysInPipeline: number;
  readonly pipelineByStage: Readonly<Record<AdmissionsStage, number>>;
};

export type AdmissionsSummary = {
  readonly pipelineByStage: Readonly<Record<string, number>>;
  readonly conversionRate: number;
  readonly averageEnrollmentDays: number;
  readonly enrollmentByCampus: Readonly<Record<string, number>>;
  readonly enrollmentByProgram: Readonly<Record<string, number>>;
  readonly scholarshipUtilization: {
    readonly awarded: number;
    readonly totalAmount: number;
    readonly interested: number;
  };
  readonly enrollmentTrends: {
    readonly enrolledThisMonth: number;
    readonly accepted: number;
    readonly declined: number;
  };
};
