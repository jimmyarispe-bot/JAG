/**
 * Education Industry Blueprint catalogs — declarative data only.
 * No runtime logic. No package ids (Organization owns pack attachment).
 */

/** Recommended foundation modules that map 1:1 to production capability packs. */
export const EDUCATION_FOUNDATION_MODULES = Object.freeze([
  "identity",
  "documents",
  "communications",
  "scheduling",
  "work",
  "decision",
  "policy",
  "reporting",
  "analytics",
] as const);

/** Education-vertical modules (not yet universal production packs). */
export const EDUCATION_VERTICAL_MODULES = Object.freeze([
  "admissions",
  "sis",
  "reports",
] as const);

export const EDUCATION_DOCUMENT_TYPE_DEFAULTS = Object.freeze([
  Object.freeze({ id: "enrollment_form", label: "Enrollment Form", family: "form" }),
  Object.freeze({ id: "handbook", label: "Student Handbook", family: "handbook" }),
  Object.freeze({ id: "iep", label: "IEP", family: "policy" }),
  Object.freeze({ id: "plan_504", label: "504 Plan", family: "policy" }),
  Object.freeze({
    id: "progress_report",
    label: "Progress Report",
    family: "report",
  }),
  Object.freeze({
    id: "attendance_notice",
    label: "Attendance Notice",
    family: "notice",
  }),
  Object.freeze({
    id: "transcript",
    label: "Transcript",
    family: "certificate",
  }),
] as const);

export const EDUCATION_COMMUNICATION_TYPE_DEFAULTS = Object.freeze([
  Object.freeze({ id: "family_announcement", label: "Family Announcement" }),
  Object.freeze({ id: "enrollment_reminder", label: "Enrollment Reminder" }),
  Object.freeze({ id: "attendance_alert", label: "Attendance Alert" }),
  Object.freeze({ id: "progress_update", label: "Progress Update" }),
  Object.freeze({ id: "emergency_notice", label: "Emergency Notice" }),
  Object.freeze({ id: "invitation", label: "Event Invitation" }),
] as const);

export const EDUCATION_SCHEDULING_CONVENTIONS = Object.freeze([
  Object.freeze({
    id: "academic_term",
    label: "Academic Term",
    schedulableTypeHint: "session",
  }),
  Object.freeze({
    id: "class_section",
    label: "Class Section",
    schedulableTypeHint: "session",
  }),
  Object.freeze({
    id: "office_hours",
    label: "Office Hours",
    schedulableTypeHint: "office_hours",
  }),
  Object.freeze({
    id: "bell_block",
    label: "Bell Block",
    schedulableTypeHint: "availability_block",
  }),
  Object.freeze({
    id: "resource_room",
    label: "Room Reservation",
    resourceTypeHint: "classroom",
  }),
] as const);

export const EDUCATION_WORK_CLASSIFICATIONS = Object.freeze([
  Object.freeze({ id: "enrollment_task", label: "Enrollment Task", workType: "task" }),
  Object.freeze({
    id: "instructional_prep",
    label: "Instructional Prep",
    workType: "activity",
  }),
  Object.freeze({
    id: "iep_milestone",
    label: "IEP Milestone",
    workType: "milestone",
  }),
  Object.freeze({
    id: "compliance_action",
    label: "Compliance Action",
    workType: "action_item",
  }),
  Object.freeze({
    id: "family_follow_up",
    label: "Family Follow-up",
    workType: "task",
  }),
] as const);

export const EDUCATION_DECISION_CATEGORIES = Object.freeze([
  Object.freeze({ id: "admissions", label: "Admissions", category: "operational" }),
  Object.freeze({
    id: "placement",
    label: "Placement",
    category: "operational",
  }),
  Object.freeze({
    id: "accommodation",
    label: "Accommodation",
    category: "compliance",
  }),
  Object.freeze({
    id: "discipline",
    label: "Discipline",
    category: "administrative",
  }),
  Object.freeze({
    id: "program_change",
    label: "Program Change",
    category: "strategic",
  }),
] as const);

export const EDUCATION_POLICY_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "attendance",
    label: "Attendance Policy",
    family: "policy",
  }),
  Object.freeze({
    id: "code_of_conduct",
    label: "Code of Conduct",
    family: "policy",
  }),
  Object.freeze({
    id: "acceptable_use",
    label: "Acceptable Use",
    family: "standard",
  }),
  Object.freeze({
    id: "enrollment_procedure",
    label: "Enrollment Procedure",
    family: "procedure",
  }),
  Object.freeze({
    id: "records_retention",
    label: "Student Records Retention",
    family: "control",
  }),
] as const);

export const EDUCATION_REPORTING_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "student_roster",
    label: "Student Roster",
    reportType: "operational",
  }),
  Object.freeze({
    id: "enrollment_status",
    label: "Enrollment Status",
    reportType: "status",
  }),
  Object.freeze({
    id: "attendance_summary",
    label: "Attendance Summary",
    reportType: "operational",
  }),
  Object.freeze({
    id: "compliance_exceptions",
    label: "Compliance Exceptions",
    reportType: "exception",
  }),
] as const);

export const EDUCATION_ANALYTICS_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "enrollment_completion_rate",
    label: "Enrollment Completion Rate",
    metricHint: "completion_rate",
  }),
  Object.freeze({
    id: "attendance_participation",
    label: "Attendance Participation",
    metricHint: "participation",
  }),
  Object.freeze({
    id: "section_utilization",
    label: "Section Utilization",
    metricHint: "utilization",
  }),
  Object.freeze({
    id: "intervention_cycle_time",
    label: "Intervention Cycle Time",
    metricHint: "cycle_time",
  }),
] as const);

/** Identity vocabulary labels (catalog only — aligns Blueprint Framework v1). */
export const EDUCATION_IDENTITY_VOCABULARY = Object.freeze([
  Object.freeze({ id: "learner", label: "Student" }),
  Object.freeze({ id: "guardian", label: "Parent/Guardian" }),
  Object.freeze({ id: "teacher", label: "Teacher" }),
  Object.freeze({ id: "staff", label: "Staff" }),
  Object.freeze({ id: "family", label: "Family" }),
] as const);

export function educationIndustryCatalogPayload() {
  return Object.freeze({
    foundationModules: EDUCATION_FOUNDATION_MODULES,
    verticalModules: EDUCATION_VERTICAL_MODULES,
    identityVocabulary: EDUCATION_IDENTITY_VOCABULARY,
    documentTypes: EDUCATION_DOCUMENT_TYPE_DEFAULTS,
    communicationTypes: EDUCATION_COMMUNICATION_TYPE_DEFAULTS,
    schedulingConventions: EDUCATION_SCHEDULING_CONVENTIONS,
    workClassifications: EDUCATION_WORK_CLASSIFICATIONS,
    decisionCategories: EDUCATION_DECISION_CATEGORIES,
    policyDefaults: EDUCATION_POLICY_DEFAULTS,
    reportingDefaults: EDUCATION_REPORTING_DEFAULTS,
    analyticsDefaults: EDUCATION_ANALYTICS_DEFAULTS,
  });
}
