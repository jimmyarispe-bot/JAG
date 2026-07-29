/**
 * Wave 1.1 Admissions Experience — product constants.
 * Orchestration only: no parallel CRM / document / finance models.
 */

/** Engines this experience consumes (never reimplements). */
export const ADMISSIONS_EXPERIENCE_ENGINES = Object.freeze([
  "OrganizationEngine",
  "IdentityEngine",
  "KnowledgeEngine",
  "LearningIntelligenceEngine",
  "FinanceEngine",
  "Workflow",
  "Notifications",
  "DigitalTwin",
  "EvidenceLedger",
  "OrganizationalMemory",
] as const);

/** Parent-facing application dashboard statuses (Wave 1.1). */
export const APPLICATION_DASHBOARD_STATUSES = Object.freeze([
  "Draft",
  "Submitted",
  "Under Review",
  "Assessment Scheduled",
  "Interview Scheduled",
  "Accepted",
  "Waitlisted",
  "Declined",
  "Enrolled",
] as const);

export type ApplicationDashboardStatus =
  (typeof APPLICATION_DASHBOARD_STATUSES)[number];

/** Maps legacy / pack statuses → dashboard chip. */
export function toDashboardStatus(input: {
  applicationStatus?: string | null;
  pipelineStage?: string | null;
  leadStage?: string | null;
}): ApplicationDashboardStatus {
  const app = (input.applicationStatus ?? "").toLowerCase();
  const stage = (
    input.pipelineStage ??
    input.leadStage ??
    ""
  ).toLowerCase();

  if (app === "draft" || app === "in_progress") return "Draft";
  if (app === "submitted") return "Submitted";
  if (app === "under_review" || stage.includes("review")) return "Under Review";
  if (app === "accepted" || stage.includes("accepted")) return "Accepted";
  if (app === "waitlisted" || stage.includes("waitlist")) return "Waitlisted";
  if (
    app === "denied" ||
    app === "declined" ||
    stage.includes("declined") ||
    stage.includes("denied")
  ) {
    return "Declined";
  }
  if (app === "enrolled" || stage.includes("enrolled")) return "Enrolled";
  if (stage.includes("assessment")) return "Assessment Scheduled";
  if (stage.includes("interview")) return "Interview Scheduled";
  if (stage.includes("application_submitted") || stage.includes("submitted")) {
    return "Submitted";
  }
  return "Draft";
}

/** Document types owned by KnowledgeEngine for admissions packets. */
export const ADMISSIONS_KNOWLEDGE_DOCUMENT_TYPES = Object.freeze([
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
] as const);

/** Multi-step online application wizard steps. */
export const APPLICATION_WIZARD_STEPS = Object.freeze([
  { id: "guardian", label: "Guardian information" },
  { id: "student", label: "Student information" },
  { id: "education", label: "Educational history" },
  { id: "medical", label: "Medical information" },
  { id: "learning", label: "Learning profile" },
  { id: "emergency", label: "Emergency contacts" },
  { id: "schools", label: "Previous schools" },
  { id: "program", label: "Program selection" },
  { id: "scholarship", label: "Scholarship selection" },
  { id: "documents", label: "Document upload" },
  { id: "review", label: "Review & submit" },
] as const);

export type ApplicationWizardStepId =
  (typeof APPLICATION_WIZARD_STEPS)[number]["id"];

/** Public website routes for the Admissions Experience. */
export const ADMISSIONS_PUBLIC_NAV = Object.freeze([
  { href: "/admissions", label: "Home" },
  { href: "/admissions/programs", label: "Programs" },
  { href: "/admissions/locations", label: "Locations" },
  { href: "/admissions/virtual", label: "Virtual" },
  { href: "/admissions/scholarships", label: "Scholarships" },
  { href: "/admissions/tuition", label: "Tuition" },
  { href: "/admissions/faqs", label: "FAQs" },
  { href: "/admissions/success-stories", label: "Success Stories" },
  { href: "/admissions/schedule-tour", label: "Schedule Tour" },
  { href: "/admissions/contact", label: "Contact" },
  { href: "/apply", label: "Interest Form" },
  { href: "/apply/portal", label: "My Application" },
] as const);

export const ADMISSIONS_EXPERIENCE_GUARDS = Object.freeze({
  productExperienceOnly: true,
  createsPlatformEngines: false,
  duplicatesBusinessLogic: false,
  duplicatesDataModels: false,
  knowledgeOwnsDocuments: true,
  financeOwnsTuition: true,
  learningIntelligenceOwnsPedagogy: true,
});

/** Parent onboarding checklist (Identity + portal activation). */
export const PARENT_ONBOARDING_CHECKLIST = Object.freeze([
  { id: "account", label: "Create / activate account", href: "/login/activate" },
  { id: "portal", label: "Open family portal", href: "/portal" },
  { id: "forms", label: "Complete required forms", href: "/portal/forms" },
  { id: "calendar", label: "Add school calendar", href: "/portal/calendar" },
  { id: "documents", label: "Review documents", href: "/portal/documents" },
  { id: "finance", label: "Set up tuition billing", href: "/apply/portal/finance" },
  { id: "welcome", label: "Welcome sequence", href: "/admissions/onboarding" },
] as const);

/** Contract / agreement kinds (enrollment packet templates). */
export const ADMISSIONS_CONTRACT_KINDS = Object.freeze([
  {
    key: "enrollment_agreement",
    label: "Enrollment Agreement",
    signatureHook: true,
  },
  {
    key: "tuition_agreement",
    label: "Tuition Agreement",
    signatureHook: true,
  },
  {
    key: "parent_handbook",
    label: "Parent Handbook Acknowledgement",
    signatureHook: true,
  },
  {
    key: "policy_acceptance",
    label: "Policy Acceptance",
    signatureHook: true,
  },
] as const);
