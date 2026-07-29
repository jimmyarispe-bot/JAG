/**
 * Wave 1.2 Parent Experience — product constants.
 * Presentation/orchestration only; no parallel engines or data models.
 */

export const PARENT_EXPERIENCE_ENGINES = Object.freeze([
  "IdentityEngine",
  "OrganizationEngine",
  "KnowledgeEngine",
  "LearningIntelligenceEngine",
  "FinanceEngine",
  "ChiefFinancialOfficerEngine",
  "Communications",
  "Notifications",
  "DigitalTwin",
  "EvidenceLedger",
  "OrganizationalMemory",
] as const);

export const PARENT_EXPERIENCE_GUARDS = Object.freeze({
  productExperienceOnly: true,
  createsPlatformEngines: false,
  duplicatesBusinessLogic: false,
  duplicatesDataModels: false,
  knowledgeOwnsDocuments: true,
  financeOwnsBilling: true,
  learningIntelligenceOwnsPedagogy: true,
  oneParentPortal: true,
});

/** Wave 1.2 parent navigation (minimal, role-aware). */
export const PARENT_EXPERIENCE_NAV = Object.freeze([
  { href: "/portal", label: "Home" },
  { href: "/portal/children", label: "My Children" },
  { href: "/portal/learning", label: "Learning" },
  { href: "/portal/attendance", label: "Attendance" },
  { href: "/portal/calendar", label: "Calendar" },
  { href: "/portal/messages", label: "Messages" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/forms", label: "Forms" },
  { href: "/portal/billing", label: "Billing" },
  { href: "/portal/contracts", label: "Contracts" },
  { href: "/portal/support", label: "Support" },
  { href: "/portal/profile", label: "Profile" },
] as const);

/** Secondary links kept for consolidation compatibility. */
export const PARENT_EXPERIENCE_SECONDARY_NAV = Object.freeze([
  { href: "/portal/notifications", label: "Notifications" },
  { href: "/portal/conferences", label: "Conferences" },
  { href: "/portal/portfolio", label: "Portfolio" },
  { href: "/portal/progress", label: "Progress (legacy)" },
  { href: "/portal/finance", label: "Finance (legacy)" },
] as const);

export const PARENT_QUICK_ACTIONS = Object.freeze([
  { href: "/portal/messages", label: "Message school" },
  { href: "/portal/calendar", label: "View calendar" },
  { href: "/portal/forms", label: "Complete forms" },
  { href: "/portal/billing", label: "Pay balance" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/attendance", label: "Attendance" },
  { href: "/portal/support", label: "Get support" },
  { href: "/portal/conferences", label: "Conferences" },
] as const);

export const PARENT_DOCUMENT_KINDS = Object.freeze([
  { key: "report_card", label: "Report cards" },
  { key: "progress_report", label: "Progress reports" },
  { key: "iep", label: "IEPs" },
  { key: "504", label: "504s" },
  { key: "evaluation", label: "Evaluations" },
  { key: "contract", label: "Contracts" },
  { key: "enrollment", label: "Enrollment documents" },
  { key: "medical", label: "Medical" },
  { key: "billing", label: "Billing statements" },
] as const);

export const PARENT_CONTRACT_KINDS = Object.freeze([
  { key: "enrollment_agreement", label: "Enrollment agreement" },
  { key: "tuition_agreement", label: "Tuition agreement" },
  { key: "handbook", label: "Handbook acknowledgements" },
  { key: "signed", label: "Signed copies" },
] as const);

export const PARENT_SUPPORT_LINKS = Object.freeze([
  { href: "/portal/support#faqs", label: "FAQs" },
  { href: "/portal/support#tickets", label: "Support tickets" },
  { href: "/portal/conferences", label: "Schedule meeting" },
  { href: "/portal/messages", label: "Contact school" },
  { href: "/admissions/faqs", label: "Admissions FAQs" },
] as const);
