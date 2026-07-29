/**
 * Wave 1.4 Teacher Workspace — product constants.
 * Presentation/orchestration only; no parallel scheduling, attendance, or LI models.
 */

export const TEACHER_EXPERIENCE_ENGINES = Object.freeze([
  "IdentityEngine",
  "OrganizationEngine",
  "LearningIntelligenceEngine",
  "KnowledgeEngine",
  "Scheduling",
  "Attendance",
  "Communications",
  "Workflow",
  "FinanceEngine",
  "Notifications",
  "DigitalTwin",
  "EvidenceLedger",
  "OrganizationalMemory",
] as const);

export const TEACHER_EXPERIENCE_GUARDS = Object.freeze({
  productExperienceOnly: true,
  createsPlatformEngines: false,
  duplicatesBusinessLogic: false,
  duplicatesLearningIntelligence: false,
  duplicatesKnowledge: false,
  duplicatesScheduling: false,
  duplicatesAttendance: false,
  duplicatesPayrollLogic: false,
  assistantEvidenceOnly: true,
});

export const TEACHER_EXPERIENCE_NAV = Object.freeze([
  { href: "/dashboard/teacher", label: "Home" },
  { href: "/dashboard/teacher/classes", label: "My Classes" },
  { href: "/dashboard/teacher/attendance", label: "Attendance" },
  { href: "/dashboard/teacher/progress", label: "Progress" },
  { href: "/dashboard/teacher/lessons", label: "Lesson Planning" },
  { href: "/dashboard/teacher/assistant", label: "AI Assistant" },
  { href: "/dashboard/teacher/communications", label: "Parent Comms" },
  { href: "/dashboard/teacher/documents", label: "Documents" },
  { href: "/dashboard/teacher/timesheets", label: "Timesheets" },
  { href: "/dashboard/teacher/resources", label: "Resources" },
  { href: "/dashboard/teacher/profile", label: "Profile" },
] as const);

export const TEACHER_QUICK_ACTIONS = Object.freeze([
  { href: "/dashboard/teacher/attendance", label: "Take attendance" },
  { href: "/dashboard/teacher/classes", label: "My classes" },
  { href: "/dashboard/teacher/progress", label: "Progress monitoring" },
  { href: "/dashboard/teacher/assistant", label: "AI assistant" },
  { href: "/dashboard/teacher/communications", label: "Message parents" },
  { href: "/dashboard/teacher/lessons", label: "Lesson plans" },
  { href: "/dashboard/teacher/timesheets", label: "Timesheets" },
] as const);
