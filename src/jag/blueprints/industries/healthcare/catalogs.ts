/**
 * Healthcare Industry Blueprint catalogs — declarative data only.
 * No runtime logic. No package ids (Organization owns pack attachment).
 * Definitions only — not compliance engines or EHR behavior.
 */

/** Recommended foundation modules that map 1:1 to production capability packs. */
export const HEALTHCARE_FOUNDATION_MODULES = Object.freeze([
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

/** Healthcare-vertical modules (industry vocabulary; not universal packs). */
export const HEALTHCARE_VERTICAL_MODULES = Object.freeze([
  "patients",
  "encounters",
  "care",
] as const);

export const HEALTHCARE_DOCUMENT_TYPE_DEFAULTS = Object.freeze([
  Object.freeze({ id: "intake_form", label: "Intake Form", family: "form" }),
  Object.freeze({ id: "consent_form", label: "Consent Form", family: "form" }),
  Object.freeze({
    id: "treatment_plan",
    label: "Treatment Plan",
    family: "plan",
  }),
  Object.freeze({
    id: "clinical_note",
    label: "Clinical Note",
    family: "note",
  }),
  Object.freeze({ id: "referral", label: "Referral", family: "referral" }),
  Object.freeze({ id: "lab_result", label: "Lab Result", family: "result" }),
  Object.freeze({
    id: "imaging_report",
    label: "Imaging Report",
    family: "report",
  }),
] as const);

export const HEALTHCARE_COMMUNICATION_TYPE_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "appointment_reminder",
    label: "Appointment Reminder",
  }),
  Object.freeze({ id: "care_message", label: "Care Message" }),
  Object.freeze({ id: "referral_notice", label: "Referral Notice" }),
  Object.freeze({
    id: "test_result_notification",
    label: "Test Result Notification",
  }),
  Object.freeze({
    id: "internal_care_coordination",
    label: "Internal Care Coordination",
  }),
] as const);

export const HEALTHCARE_SCHEDULING_CONVENTIONS = Object.freeze([
  Object.freeze({
    id: "appointment",
    label: "Appointment",
    schedulableTypeHint: "appointment",
  }),
  Object.freeze({
    id: "procedure",
    label: "Procedure",
    schedulableTypeHint: "procedure",
  }),
  Object.freeze({
    id: "surgery",
    label: "Surgery",
    schedulableTypeHint: "procedure",
  }),
  Object.freeze({
    id: "follow_up",
    label: "Follow-Up",
    schedulableTypeHint: "appointment",
  }),
  Object.freeze({
    id: "provider_shift",
    label: "Provider Shift",
    schedulableTypeHint: "shift",
  }),
  Object.freeze({
    id: "on_call_rotation",
    label: "On-Call Rotation",
    schedulableTypeHint: "on_call",
  }),
] as const);

export const HEALTHCARE_WORK_CLASSIFICATIONS = Object.freeze([
  Object.freeze({ id: "care_task", label: "Care Task", workType: "task" }),
  Object.freeze({
    id: "referral_follow_up",
    label: "Referral Follow-Up",
    workType: "task",
  }),
  Object.freeze({
    id: "medication_review",
    label: "Medication Review",
    workType: "activity",
  }),
  Object.freeze({
    id: "care_plan_review",
    label: "Care Plan Review",
    workType: "milestone",
  }),
  Object.freeze({
    id: "documentation_task",
    label: "Documentation Task",
    workType: "action_item",
  }),
] as const);

export const HEALTHCARE_DECISION_CATEGORIES = Object.freeze([
  Object.freeze({
    id: "clinical",
    label: "Clinical Decision",
    category: "clinical",
  }),
  Object.freeze({
    id: "administrative",
    label: "Administrative Decision",
    category: "administrative",
  }),
  Object.freeze({
    id: "discharge",
    label: "Discharge Decision",
    category: "operational",
  }),
  Object.freeze({
    id: "referral",
    label: "Referral Decision",
    category: "operational",
  }),
] as const);

export const HEALTHCARE_POLICY_DEFAULTS = Object.freeze([
  Object.freeze({ id: "hipaa", label: "HIPAA Policy", family: "control" }),
  Object.freeze({ id: "consent", label: "Consent Policy", family: "policy" }),
  Object.freeze({
    id: "documentation",
    label: "Documentation Policy",
    family: "standard",
  }),
  Object.freeze({
    id: "medication",
    label: "Medication Policy",
    family: "procedure",
  }),
  Object.freeze({ id: "privacy", label: "Privacy Policy", family: "control" }),
] as const);

export const HEALTHCARE_REPORTING_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "appointment_volume",
    label: "Appointment Volume",
    reportType: "operational",
  }),
  Object.freeze({
    id: "readmission",
    label: "Readmission Report",
    reportType: "status",
  }),
  Object.freeze({
    id: "provider_productivity",
    label: "Provider Productivity",
    reportType: "operational",
  }),
  Object.freeze({
    id: "referral",
    label: "Referral Report",
    reportType: "operational",
  }),
  Object.freeze({
    id: "wait_time",
    label: "Wait Time Report",
    reportType: "exception",
  }),
] as const);

export const HEALTHCARE_ANALYTICS_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "utilization",
    label: "Utilization",
    metricHint: "utilization",
  }),
  Object.freeze({
    id: "capacity",
    label: "Capacity",
    metricHint: "capacity",
  }),
  Object.freeze({
    id: "readmission_rate",
    label: "Readmission Rate",
    metricHint: "rate",
  }),
  Object.freeze({
    id: "average_wait_time",
    label: "Average Wait Time",
    metricHint: "cycle_time",
  }),
  Object.freeze({
    id: "no_show_rate",
    label: "No-Show Rate",
    metricHint: "rate",
  }),
  Object.freeze({
    id: "patient_satisfaction",
    label: "Patient Satisfaction",
    metricHint: "satisfaction",
  }),
] as const);

/** Identity vocabulary labels (catalog only — not pack entities). */
export const HEALTHCARE_IDENTITY_VOCABULARY = Object.freeze([
  Object.freeze({ id: "patient", label: "Patient" }),
  Object.freeze({ id: "provider", label: "Provider" }),
  Object.freeze({ id: "clinician", label: "Clinician" }),
  Object.freeze({ id: "care_team", label: "Care Team" }),
  Object.freeze({ id: "family_contact", label: "Family Contact" }),
] as const);

export function healthcareIndustryCatalogPayload() {
  return Object.freeze({
    foundationModules: HEALTHCARE_FOUNDATION_MODULES,
    verticalModules: HEALTHCARE_VERTICAL_MODULES,
    identityVocabulary: HEALTHCARE_IDENTITY_VOCABULARY,
    documentTypes: HEALTHCARE_DOCUMENT_TYPE_DEFAULTS,
    communicationTypes: HEALTHCARE_COMMUNICATION_TYPE_DEFAULTS,
    schedulingConventions: HEALTHCARE_SCHEDULING_CONVENTIONS,
    workClassifications: HEALTHCARE_WORK_CLASSIFICATIONS,
    decisionCategories: HEALTHCARE_DECISION_CATEGORIES,
    policyDefaults: HEALTHCARE_POLICY_DEFAULTS,
    reportingDefaults: HEALTHCARE_REPORTING_DEFAULTS,
    analyticsDefaults: HEALTHCARE_ANALYTICS_DEFAULTS,
  });
}
