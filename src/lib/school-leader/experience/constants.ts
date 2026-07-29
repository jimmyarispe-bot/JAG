/**
 * Wave 1.5 School Leader Workspace — product constants.
 * Presentation/orchestration only; no parallel finance, LI, scheduling, or HR models.
 */

export const SCHOOL_LEADER_EXPERIENCE_ENGINES = Object.freeze([
  "OrganizationEngine",
  "IdentityEngine",
  "LearningIntelligenceEngine",
  "KnowledgeEngine",
  "FinanceEngine",
  "ChiefFinancialOfficerEngine",
  "Scheduling",
  "Attendance",
  "Communications",
  "Workflow",
  "Notifications",
  "DigitalTwin",
  "EvidenceLedger",
  "OrganizationalMemory",
] as const);

export const SCHOOL_LEADER_EXPERIENCE_GUARDS = Object.freeze({
  productExperienceOnly: true,
  createsPlatformEngines: false,
  duplicatesBusinessLogic: false,
  duplicatesLearningIntelligence: false,
  duplicatesFinance: false,
  duplicatesKnowledge: false,
  duplicatesScheduling: false,
  duplicatesHrLogic: false,
  financeReadOnlySummaries: true,
  cfoReadOnlyOperationalSummaries: true,
});

export const SCHOOL_LEADER_EXPERIENCE_NAV = Object.freeze([
  { href: "/dashboard/school-leader", label: "Home" },
  { href: "/dashboard/school-leader/enrollment", label: "Enrollment" },
  { href: "/dashboard/school-leader/students", label: "Students" },
  { href: "/dashboard/school-leader/teachers", label: "Teachers" },
  { href: "/dashboard/school-leader/academics", label: "Academics" },
  { href: "/dashboard/school-leader/scheduling", label: "Scheduling" },
  { href: "/dashboard/school-leader/compliance", label: "Compliance" },
  { href: "/dashboard/school-leader/finance", label: "Finance" },
  { href: "/dashboard/school-leader/hr", label: "HR" },
  { href: "/dashboard/school-leader/communications", label: "Communications" },
  { href: "/dashboard/school-leader/reports", label: "Reports" },
  { href: "/dashboard/school-leader/profile", label: "Profile" },
] as const);

export const SCHOOL_LEADER_QUICK_ACTIONS = Object.freeze([
  { href: "/dashboard/school-leader/enrollment", label: "Enrollment pipeline" },
  { href: "/dashboard/school-leader/students", label: "Student roster" },
  { href: "/dashboard/school-leader/teachers", label: "Teacher roster" },
  { href: "/dashboard/school-leader/scheduling", label: "Scheduling" },
  { href: "/dashboard/school-leader/compliance", label: "Compliance" },
  { href: "/dashboard/school-leader/finance", label: "Finance summaries" },
  { href: "/dashboard/school-leader/communications", label: "Announcements" },
  { href: "/dashboard/admissions", label: "Open Admissions CRM" },
] as const);
