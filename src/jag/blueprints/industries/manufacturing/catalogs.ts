/**
 * Manufacturing Industry Blueprint catalogs — declarative data only.
 * No runtime logic. No package ids (Organization owns pack attachment).
 * Definitions only — not MES, OEE calculators, or optimization engines.
 */

/** Recommended foundation modules that map 1:1 to production capability packs. */
export const MANUFACTURING_FOUNDATION_MODULES = Object.freeze([
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

/** Manufacturing-vertical modules (industry vocabulary; not universal packs). */
export const MANUFACTURING_VERTICAL_MODULES = Object.freeze([
  "bom",
  "work_orders",
  "inventory",
] as const);

export const MANUFACTURING_DOCUMENT_TYPE_DEFAULTS = Object.freeze([
  Object.freeze({ id: "work_order", label: "Work Order", family: "order" }),
  Object.freeze({
    id: "production_order",
    label: "Production Order",
    family: "order",
  }),
  Object.freeze({
    id: "quality_report",
    label: "Quality Report",
    family: "report",
  }),
  Object.freeze({
    id: "inspection_record",
    label: "Inspection Record",
    family: "record",
  }),
  Object.freeze({
    id: "maintenance_log",
    label: "Maintenance Log",
    family: "log",
  }),
  Object.freeze({
    id: "safety_procedure",
    label: "Safety Procedure",
    family: "procedure",
  }),
] as const);

export const MANUFACTURING_COMMUNICATION_TYPE_DEFAULTS = Object.freeze([
  Object.freeze({ id: "production_alert", label: "Production Alert" }),
  Object.freeze({
    id: "maintenance_notification",
    label: "Maintenance Notification",
  }),
  Object.freeze({ id: "shift_handoff", label: "Shift Handoff" }),
  Object.freeze({ id: "supplier_notice", label: "Supplier Notice" }),
] as const);

export const MANUFACTURING_SCHEDULING_CONVENTIONS = Object.freeze([
  Object.freeze({
    id: "production_shift",
    label: "Production Shift",
    schedulableTypeHint: "shift",
  }),
  Object.freeze({
    id: "machine_schedule",
    label: "Machine Schedule",
    schedulableTypeHint: "resource",
  }),
  Object.freeze({
    id: "maintenance_window",
    label: "Maintenance Window",
    schedulableTypeHint: "maintenance",
  }),
  Object.freeze({
    id: "downtime",
    label: "Downtime",
    schedulableTypeHint: "downtime",
  }),
  Object.freeze({
    id: "production_run",
    label: "Production Run",
    schedulableTypeHint: "run",
  }),
] as const);

export const MANUFACTURING_WORK_CLASSIFICATIONS = Object.freeze([
  Object.freeze({
    id: "assembly_task",
    label: "Assembly Task",
    workType: "task",
  }),
  Object.freeze({
    id: "inspection_task",
    label: "Inspection Task",
    workType: "activity",
  }),
  Object.freeze({
    id: "maintenance_task",
    label: "Maintenance Task",
    workType: "task",
  }),
  Object.freeze({
    id: "packaging_task",
    label: "Packaging Task",
    workType: "task",
  }),
  Object.freeze({
    id: "shipping_task",
    label: "Shipping Task",
    workType: "action_item",
  }),
] as const);

export const MANUFACTURING_DECISION_CATEGORIES = Object.freeze([
  Object.freeze({
    id: "production",
    label: "Production Decision",
    category: "operational",
  }),
  Object.freeze({
    id: "quality",
    label: "Quality Decision",
    category: "compliance",
  }),
  Object.freeze({
    id: "maintenance",
    label: "Maintenance Decision",
    category: "operational",
  }),
  Object.freeze({
    id: "procurement",
    label: "Procurement Decision",
    category: "administrative",
  }),
] as const);

export const MANUFACTURING_POLICY_DEFAULTS = Object.freeze([
  Object.freeze({ id: "safety", label: "Safety Policy", family: "control" }),
  Object.freeze({ id: "quality", label: "Quality Policy", family: "standard" }),
  Object.freeze({
    id: "maintenance",
    label: "Maintenance Policy",
    family: "procedure",
  }),
  Object.freeze({
    id: "environmental",
    label: "Environmental Policy",
    family: "policy",
  }),
] as const);

export const MANUFACTURING_REPORTING_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "production_output",
    label: "Production Output",
    reportType: "operational",
  }),
  Object.freeze({
    id: "downtime",
    label: "Downtime Report",
    reportType: "exception",
  }),
  Object.freeze({
    id: "defect",
    label: "Defect Report",
    reportType: "exception",
  }),
  Object.freeze({
    id: "inventory_movement",
    label: "Inventory Movement",
    reportType: "status",
  }),
  Object.freeze({
    id: "maintenance",
    label: "Maintenance Report",
    reportType: "operational",
  }),
] as const);

export const MANUFACTURING_ANALYTICS_DEFAULTS = Object.freeze([
  Object.freeze({
    id: "oee",
    label: "OEE (Overall Equipment Effectiveness)",
    metricHint: "oee",
  }),
  Object.freeze({ id: "yield", label: "Yield", metricHint: "yield" }),
  Object.freeze({
    id: "scrap_rate",
    label: "Scrap Rate",
    metricHint: "rate",
  }),
  Object.freeze({
    id: "throughput",
    label: "Throughput",
    metricHint: "throughput",
  }),
  Object.freeze({
    id: "downtime",
    label: "Downtime",
    metricHint: "downtime",
  }),
  Object.freeze({ id: "mtbf", label: "MTBF", metricHint: "mtbf" }),
  Object.freeze({ id: "mttr", label: "MTTR", metricHint: "mttr" }),
  Object.freeze({
    id: "capacity_utilization",
    label: "Capacity Utilization",
    metricHint: "utilization",
  }),
] as const);

/** Identity vocabulary labels (catalog only — not pack entities). */
export const MANUFACTURING_IDENTITY_VOCABULARY = Object.freeze([
  Object.freeze({ id: "employee", label: "Employee" }),
  Object.freeze({ id: "operator", label: "Operator" }),
  Object.freeze({ id: "supervisor", label: "Supervisor" }),
  Object.freeze({ id: "technician", label: "Technician" }),
  Object.freeze({ id: "vendor", label: "Vendor" }),
  Object.freeze({ id: "customer", label: "Customer" }),
] as const);

export function manufacturingIndustryCatalogPayload() {
  return Object.freeze({
    foundationModules: MANUFACTURING_FOUNDATION_MODULES,
    verticalModules: MANUFACTURING_VERTICAL_MODULES,
    identityVocabulary: MANUFACTURING_IDENTITY_VOCABULARY,
    documentTypes: MANUFACTURING_DOCUMENT_TYPE_DEFAULTS,
    communicationTypes: MANUFACTURING_COMMUNICATION_TYPE_DEFAULTS,
    schedulingConventions: MANUFACTURING_SCHEDULING_CONVENTIONS,
    workClassifications: MANUFACTURING_WORK_CLASSIFICATIONS,
    decisionCategories: MANUFACTURING_DECISION_CATEGORIES,
    policyDefaults: MANUFACTURING_POLICY_DEFAULTS,
    reportingDefaults: MANUFACTURING_REPORTING_DEFAULTS,
    analyticsDefaults: MANUFACTURING_ANALYTICS_DEFAULTS,
  });
}
