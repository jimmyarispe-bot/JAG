/**
 * Government Industry Blueprint catalogs — declarative data only.
 * No runtime logic. No package ids (Organization owns pack attachment).
 * Definitions only — not legislative engines or optimization logic.
 */

/** Recommended foundation modules that map 1:1 to production capability packs. */
export const GOVERNMENT_FOUNDATION_MODULES = Object.freeze([
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

/** Government-vertical modules (industry vocabulary; not universal packs). */
export const GOVERNMENT_VERTICAL_MODULES = Object.freeze([
  "cases",
  "constituents",
  "permits",
] as const);

export const GOVERNMENT_DOCUMENT_TYPE_DEFAULTS = Object.freeze([
  Object.freeze({ id: "ordinance", label: "Ordinance", family: "legislative" }),
  Object.freeze({
    id: "resolution",
    label: "Resolution",
    family: "legislative",
  }),
  Object.freeze({ id: "permit", label: "Permit", family: "permit" }),
  Object.freeze({ id: "license", label: "License", family: "license" }),
  Object.freeze({
    id: "public_notice",
    label: "Public Notice",
    family: "notice",
  }),
  Object.freeze({
    id: "meeting_minutes",
    label: "Meeting Minutes",
    family: "record",
  }),
  Object.freeze({
    id: "budget_document",
    label: "Budget Document",
    family: "budget",
  }),
  Object.freeze({
    id: "grant_agreement",
    label: "Grant Agreement",
    family: "agreement",
  }),
] as const);

export const GOVERNMENT_COMMUNICATION_TYPE_DEFAULTS = Object.freeze([
  Object.freeze({ id: "public_notice", label: "Public Notice" }),
  Object.freeze({
    id: "citizen_notification",
    label: "Citizen Notification",
  }),
  Object.freeze({ id: "council_agenda", label: "Council Agenda" }),
  Object.freeze({ id: "emergency_alert", label: "Emergency Alert" }),
  Object.freeze({
    id: "department_announcement",
    label: "Department Announcement",
  }),
] as const);

export const GOVERNMENT_SCHEDULING_CONVENTIONS = Object.freeze([
  Object.freeze({
    id: "council_meeting",
    label: "Council Meeting",
    schedulableTypeHint: "meeting",
  }),
  Object.freeze({
    id: "committee_meeting",
    label: "Committee Meeting",
    schedulableTypeHint: "meeting",
  }),
  Object.freeze({
    id: "public_hearing",
    label: "Public Hearing",
    schedulableTypeHint: "hearing",
  }),
  Object.freeze({
    id: "inspection",
    label: "Inspection",
    schedulableTypeHint: "inspection",
  }),
  Object.freeze({
    id: "permit_review",
    label: "Permit Review",
    schedulableTypeHint: "review",
  }),
  Object.freeze({
    id: "budget_session",
    label: "Budget Session",
    schedulableTypeHint: "session",
  }),
] as const);

export const GOVERNMENT_WORK_CLASSIFICATIONS = Object.freeze([
  Object.freeze({
    id: "permit_review",
    label: "Permit Review",
    workType: "task",
  }),
  Object.freeze({
    id: "inspection",
    label: "Inspection",
    workType: "activity",
  }),
  Object.freeze({
    id: "case_management",
    label: "Case Management",
    workType: "task",
  }),
  Object.freeze({
    id: "grant_administration",
    label: "Grant Administration",
    workType: "activity",
  }),
  Object.freeze({
    id: "public_works_task",
    label: "Public Works Task",
    workType: "task",
  }),
  Object.freeze({
    id: "procurement_activity",
    label: "Procurement Activity",
    workType: "action_item",
  }),
] as const);

export const GOVERNMENT_DECISION_CATEGORIES = Object.freeze([
  Object.freeze({
    id: "legislative",
    label: "Legislative Decision",
    category: "strategic",
  }),
  Object.freeze({
    id: "administrative",
    label: "Administrative Decision",
    category: "administrative",
  }),
  Object.freeze({
    id: "procurement",
    label: "Procurement Decision",
    category: "administrative",
  }),
  Object.freeze({
    id: "budget_approval",
    label: "Budget Approval",
    category: "strategic",
  }),
  Object.freeze({
    id: "permit",
    label: "Permit Decision",
    category: "operational",
  }),
] as const);

export const GOVERNMENT_POLICY_DEFAULTS = Object.freeze([
  Object.freeze({ id: "ethics", label: "Ethics Policy", family: "control" }),
  Object.freeze({
    id: "procurement",
    label: "Procurement Policy",
    family: "procedure",
  }),
  Object.freeze({
    id: "records_retention",
    label: "Records Retention Policy",
    family: "control",
  }),
  Object.freeze({
    id: "public_access",
    label: "Public Access Policy",
    family: "policy",
  }),
  Object.freeze({
    id: "financial_controls",
    label: "Financial Controls Policy",
    family: "standard",
  }),
] as const);

export const GOVERNMENT_REPORTING_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "budget",
    label: "Budget Report",
    reportType: "status",
  }),
  Object.freeze({
    id: "permit_activity",
    label: "Permit Activity Report",
    reportType: "operational",
  }),
  Object.freeze({
    id: "capital_project",
    label: "Capital Project Report",
    reportType: "status",
  }),
  Object.freeze({
    id: "grant_status",
    label: "Grant Status Report",
    reportType: "status",
  }),
  Object.freeze({
    id: "citizen_service",
    label: "Citizen Service Report",
    reportType: "operational",
  }),
] as const);

export const GOVERNMENT_ANALYTICS_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "permit_processing_time",
    label: "Permit Processing Time",
    metricHint: "cycle_time",
  }),
  Object.freeze({
    id: "budget_utilization",
    label: "Budget Utilization",
    metricHint: "utilization",
  }),
  Object.freeze({
    id: "citizen_response_time",
    label: "Citizen Response Time",
    metricHint: "cycle_time",
  }),
  Object.freeze({
    id: "project_completion_rate",
    label: "Project Completion Rate",
    metricHint: "completion_rate",
  }),
  Object.freeze({
    id: "service_request_resolution",
    label: "Service Request Resolution",
    metricHint: "resolution_rate",
  }),
  Object.freeze({
    id: "inspection_compliance_rate",
    label: "Inspection Compliance Rate",
    metricHint: "compliance_rate",
  }),
] as const);

/** Identity vocabulary labels (catalog only — not pack entities). */
export const GOVERNMENT_IDENTITY_VOCABULARY = Object.freeze([
  Object.freeze({ id: "citizen", label: "Citizen" }),
  Object.freeze({ id: "resident", label: "Resident" }),
  Object.freeze({ id: "elected_official", label: "Elected Official" }),
  Object.freeze({ id: "appointed_official", label: "Appointed Official" }),
  Object.freeze({ id: "department_director", label: "Department Director" }),
  Object.freeze({ id: "agency_employee", label: "Agency Employee" }),
  Object.freeze({ id: "contractor", label: "Contractor" }),
] as const);

export function governmentIndustryCatalogPayload() {
  return Object.freeze({
    foundationModules: GOVERNMENT_FOUNDATION_MODULES,
    verticalModules: GOVERNMENT_VERTICAL_MODULES,
    identityVocabulary: GOVERNMENT_IDENTITY_VOCABULARY,
    documentTypes: GOVERNMENT_DOCUMENT_TYPE_DEFAULTS,
    communicationTypes: GOVERNMENT_COMMUNICATION_TYPE_DEFAULTS,
    schedulingConventions: GOVERNMENT_SCHEDULING_CONVENTIONS,
    workClassifications: GOVERNMENT_WORK_CLASSIFICATIONS,
    decisionCategories: GOVERNMENT_DECISION_CATEGORIES,
    policyDefaults: GOVERNMENT_POLICY_DEFAULTS,
    reportingDefaults: GOVERNMENT_REPORTING_DEFAULTS,
    analyticsDefaults: GOVERNMENT_ANALYTICS_DEFAULTS,
  });
}
