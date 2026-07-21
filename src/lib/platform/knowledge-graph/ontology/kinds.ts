/**
 * RC-4 — Unified Knowledge Graph core entity types.
 * Connectors map into these kinds only; intelligence never sees vendor models.
 */

export const UNIFIED_ENTITY_TYPES = [
  "Person",
  "Organization",
  "Department",
  "Meeting",
  "Communication",
  "Document",
  "Task",
  "Decision",
  "Initiative",
  "Portfolio",
  "Risk",
  "Opportunity",
  "FinancialTransaction",
  "Customer",
  "Vendor",
  "Employee",
  "Student",
  "Teacher",
  "Parent",
  "Class",
  "Course",
] as const;

export type UnifiedEntityType = (typeof UNIFIED_ENTITY_TYPES)[number];

/** Display labels for ECC / search (Financial Transaction with space). */
export const ENTITY_DISPLAY_LABEL: Record<UnifiedEntityType, string> = {
  Person: "Person",
  Organization: "Organization",
  Department: "Department",
  Meeting: "Meeting",
  Communication: "Communication",
  Document: "Document",
  Task: "Task",
  Decision: "Decision",
  Initiative: "Initiative",
  Portfolio: "Portfolio",
  Risk: "Risk",
  Opportunity: "Opportunity",
  FinancialTransaction: "Financial Transaction",
  Customer: "Customer",
  Vendor: "Vendor",
  Employee: "Employee",
  Student: "Student",
  Teacher: "Teacher",
  Parent: "Parent",
  Class: "Class",
  Course: "Course",
};
