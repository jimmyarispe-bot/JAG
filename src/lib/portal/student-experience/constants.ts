/**
 * Wave 1.3 Student Experience — product constants.
 * Presentation/orchestration only; no parallel learning or assessment models.
 */

export const STUDENT_EXPERIENCE_ENGINES = Object.freeze([
  "IdentityEngine",
  "OrganizationEngine",
  "LearningIntelligenceEngine",
  "KnowledgeEngine",
  "FinanceEngine",
  "Communications",
  "Scheduling",
  "Notifications",
  "DigitalTwin",
  "EvidenceLedger",
  "OrganizationalMemory",
] as const);

export const STUDENT_EXPERIENCE_GUARDS = Object.freeze({
  productExperienceOnly: true,
  createsPlatformEngines: false,
  duplicatesBusinessLogic: false,
  duplicatesLearningModels: false,
  duplicatesAssessments: false,
  duplicatesKnowledge: false,
  learningIntelligenceOwnsPedagogy: true,
  knowledgeOwnsDocuments: true,
  noHallucinatedCoachAdvice: true,
});

/** Wave 1.3 student navigation (minimal). */
export const STUDENT_EXPERIENCE_NAV = Object.freeze([
  { href: "/portal/student", label: "Home" },
  { href: "/portal/student/learning", label: "My Learning" },
  { href: "/portal/student/assignments", label: "Assignments" },
  { href: "/portal/student/assessments", label: "Assessments" },
  { href: "/portal/student/attendance", label: "Attendance" },
  { href: "/portal/student/calendar", label: "Calendar" },
  { href: "/portal/messages", label: "Messages" },
  { href: "/portal/student/documents", label: "Documents" },
  { href: "/portal/student/goals", label: "Goals" },
  { href: "/portal/student/achievements", label: "Achievements" },
  { href: "/portal/student/coach", label: "Learning Coach" },
  { href: "/portal/student/profile", label: "Profile" },
] as const);

export const STUDENT_QUICK_ACTIONS = Object.freeze([
  { href: "/portal/student/assignments", label: "Assignments" },
  { href: "/portal/student/learning", label: "My Learning" },
  { href: "/portal/student/schedule", label: "Schedule" },
  { href: "/portal/messages", label: "Messages" },
  { href: "/portal/student/coach", label: "Ask coach" },
  { href: "/portal/student/goals", label: "Goals" },
] as const);

export const STUDENT_DOCUMENT_KINDS = Object.freeze([
  { key: "report_card", label: "Report cards" },
  { key: "progress_report", label: "Progress reports" },
  { key: "certificate", label: "Certificates" },
  { key: "resource", label: "Shared resources" },
] as const);
