import { FUNDING_SOURCES, fundingSourceCategory } from "@/lib/constants/programs";

export const APPLICATION_DOCUMENT_TYPES = [
  { type: "birth_certificate", label: "Birth Certificate", required: true },
  { type: "evaluation", label: "Evaluations", required: false },
  { type: "iep", label: "IEP", required: false },
  { type: "504", label: "504 Plan", required: false },
  { type: "report_card", label: "Report Cards", required: true },
  { type: "transcript", label: "Transcripts", required: false },
  { type: "assessment", label: "Assessments", required: false },
  { type: "medical", label: "Medical Documents", required: false },
  { type: "immunization", label: "Immunization Records", required: true },
  { type: "other", label: "Other", required: false },
  { type: "photo_id", label: "Student Photo ID", required: false },
] as const;

export const STATE_FUNDING_DOCUMENT_TYPES = [
  { type: "esa_award_letter", label: "State Funding Award Letter", required: true },
  { type: "state_enrollment_form", label: "State Enrollment Form", required: true },
  { type: "proof_of_residency", label: "Proof of Residency", required: true },
] as const;

export const FINANCIAL_AID_DOCUMENT_TYPES = [
  { type: "tax_return", label: "Most Recent Tax Return", required: true },
  { type: "pay_stub", label: "Recent Pay Stub", required: false },
  { type: "financial_aid_statement", label: "Financial Aid Statement", required: false },
] as const;

export type ApplicationDocumentType = (typeof APPLICATION_DOCUMENT_TYPES)[number]["type"];
export type StateFundingDocumentType = (typeof STATE_FUNDING_DOCUMENT_TYPES)[number]["type"];
export type FinancialAidDocumentType = (typeof FINANCIAL_AID_DOCUMENT_TYPES)[number]["type"];

export const STATE_FUNDING_CODES = FUNDING_SOURCES.filter(
  (f) => f.category === "state_funding"
).map((f) => f.value);

export const SCHOLARSHIP_FUNDING_CODES = FUNDING_SOURCES.filter(
  (f) => f.category === "scholarship"
).map((f) => f.value);

export function requiresStateFundingVerification(fundingCodes: string[]): boolean {
  return fundingCodes.some((code) => fundingSourceCategory(code) === "state_funding");
}

export function requiresFinancialAid(fundingCodes: string[]): boolean {
  return fundingCodes.some((code) => fundingSourceCategory(code) === "scholarship");
}

export const PORTAL_PROGRESS_STEPS = [
  { id: "inquiry", label: "Inquiry Submitted" },
  { id: "application", label: "Application Information" },
  { id: "documents", label: "Required Documents" },
  { id: "state_funding", label: "State Funding Verification" },
  { id: "financial_aid", label: "Financial Aid Documents" },
  { id: "review", label: "Admissions Review" },
  { id: "decision", label: "Decision" },
] as const;

export type PortalProgressStepId = (typeof PORTAL_PROGRESS_STEPS)[number]["id"];

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  denied: "Denied",
  withdrawn: "Withdrawn",
};

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  documents_submitted: "Documents Submitted",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
};
