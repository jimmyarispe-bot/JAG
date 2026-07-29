/**
 * Enrollment Intelligence — normalized input/output contracts.
 * Hosts supply these shapes; this module never queries a database.
 */

/** Attribute key for embedding enrollment observation on Intent/Context. */
export const ENROLLMENT_OBSERVATION_ATTR = "education.enrollment" as const;

export const ENROLLMENT_CONTRIBUTOR_ID =
  "education.cognition.enrollment" as const;

export interface EnrollmentStudentContract {
  studentId: string;
  displayName?: string;
  gradeBand?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface EnrollmentFamilyContract {
  familyId: string;
  displayName?: string;
  primaryContactId?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface EnrollmentProgramContract {
  programId: string;
  name?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface EnrollmentCampusContract {
  campusId: string;
  name?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface EnrollmentCapacityContract {
  seatsTotal: number;
  seatsFilled: number;
  waitlistOpen?: boolean;
}

export type EnrollmentScholarshipStatus =
  | "none"
  | "pending"
  | "approved"
  | "denied"
  | "review_required";

export interface EnrollmentScholarshipContract {
  status: EnrollmentScholarshipStatus;
  scholarshipId?: string;
  notes?: string;
}

export type EnrollmentDocumentStatus =
  | "missing"
  | "submitted"
  | "verified"
  | "rejected";

export interface EnrollmentDocumentRequirement {
  documentId: string;
  kind: string;
  label?: string;
  status: EnrollmentDocumentStatus;
  required: boolean;
}

export interface EnrollmentAcademicHistoryContract {
  transcriptOnFile: boolean;
  priorSchoolId?: string;
  gpa?: number;
  notes?: string;
}

export type EnrollmentAssessmentStatus =
  | "not_required"
  | "pending"
  | "complete"
  | "incomplete";

export interface EnrollmentAssessmentContract {
  status: EnrollmentAssessmentStatus;
  assessmentId?: string;
}

export type EnrollmentInterviewStatus =
  | "not_required"
  | "pending"
  | "complete"
  | "scheduled";

export interface EnrollmentInterviewContract {
  status: EnrollmentInterviewStatus;
  interviewId?: string;
}

export interface EnrollmentSignatureRequirement {
  signatureId: string;
  role: string;
  complete: boolean;
}

/** Normalized enrollment observation — sole analyzer input. */
export interface EnrollmentObservation {
  enrollmentRequestId: string;
  organizationId: string;
  student: EnrollmentStudentContract;
  family?: EnrollmentFamilyContract;
  program: EnrollmentProgramContract;
  campus?: EnrollmentCampusContract;
  capacity?: EnrollmentCapacityContract;
  scholarship?: EnrollmentScholarshipContract;
  requiredDocuments?: readonly EnrollmentDocumentRequirement[];
  academicHistory?: EnrollmentAcademicHistoryContract;
  assessment?: EnrollmentAssessmentContract;
  interview?: EnrollmentInterviewContract;
  signatures?: readonly EnrollmentSignatureRequirement[];
  /** Opaque host attributes — never interpreted as SoR queries. */
  attributes?: Readonly<Record<string, unknown>>;
}

export type EnrollmentRecommendationKind =
  | "approve_enrollment"
  | "hold_pending_documents"
  | "waitlist"
  | "request_evaluation"
  | "assign_campus"
  | "assign_program"
  | "flag_scholarship_review"
  | "recommend_parent_meeting";

/** Action proposals only — never executed by this contributor. */
export type EnrollmentActionProposalKind =
  | "ApproveEnrollment"
  | "RejectEnrollment"
  | "RequestDocuments"
  | "ScheduleEvaluation"
  | "NotifyFamily"
  | "AssignCampus"
  | "AssignProgram"
  | "WaitlistEnrollment"
  | "FlagScholarshipReview"
  | "ScheduleParentMeeting";

export interface EnrollmentActionProposal {
  kind: EnrollmentActionProposalKind;
  /** Opaque Action Runtime action id candidate. */
  actionId: string;
  label: string;
  priority: number;
  rationale: string;
}

export interface EnrollmentConstitutionalTrace {
  domainPackageId: "education";
  contributorId: typeof ENROLLMENT_CONTRIBUTOR_ID;
  /** Constitutional anchors (e.g. Law 7 evidence). */
  laws: readonly string[];
  rationale: string;
}

export interface EnrollmentRecommendation {
  id: string;
  kind: EnrollmentRecommendationKind;
  title: string;
  /** Why this recommendation exists. */
  explanation: string;
  confidence: number;
  priority: number;
  evidenceIds: readonly string[];
  suggestedActions: readonly EnrollmentActionProposal[];
  constitutionalTrace: EnrollmentConstitutionalTrace;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface EnrollmentIntelligenceResult {
  enrollmentRequestId: string;
  evidence: readonly import("@/lib/jag/runtime").CognitiveEvidenceRef[];
  recommendations: readonly EnrollmentRecommendation[];
  /** Overall readiness confidence 0..1. */
  confidence: number;
  explanation: string;
  /** Highest urgency among recommendations (lower number = higher urgency). */
  priority: number;
  blockingIssues: readonly string[];
  warnings: readonly string[];
  suggestedActions: readonly EnrollmentActionProposal[];
  readiness: "ready" | "blocked" | "conditional";
  analyzedAt: string;
}

export const ENROLLMENT_ACTION_PROPOSAL_IDS = {
  ApproveEnrollment: "education.enrollment.approve",
  RejectEnrollment: "education.enrollment.reject",
  RequestDocuments: "education.enrollment.request_documents",
  ScheduleEvaluation: "education.enrollment.schedule_evaluation",
  NotifyFamily: "education.enrollment.notify_family",
  AssignCampus: "education.enrollment.assign_campus",
  AssignProgram: "education.enrollment.assign_program",
  WaitlistEnrollment: "education.enrollment.waitlist",
  FlagScholarshipReview: "education.enrollment.flag_scholarship_review",
  ScheduleParentMeeting: "education.enrollment.schedule_parent_meeting",
} as const;
